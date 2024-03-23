import orgBondsData from "../datasource/parsedpurchasers.json";
import partyBondData from "../datasource/parsedparties.json";
import { ResponsiveContainer, XAxis, AreaChart, YAxis, Tooltip, Area, CartesianGrid, PieChart, Pie } from 'recharts';
import { useState } from "react";
import { JsonToTable } from "react-json-to-table";
import { currencyFormatter, rainbow } from "../utils";
import Multiselect from 'multiselect-react-dropdown';
import { useEffect } from "react";

function prepareData() {
    let organizationWiseData = {};
    let partyWiseData = {};
    let bondData = {};

    orgBondsData.forEach(data => {
        let orgName = data["Name of the Purchaser"];
        bondData[data["Bond Number"]] = {
            orgName: orgName
        };
        if (organizationWiseData[orgName]) {
            organizationWiseData[orgName]["Total Bonds Purchased"] += 1;
            organizationWiseData[orgName]["Total Bonds Valuation"] += data["Denominations"];
            organizationWiseData[orgName]["Average Value Per Bond"] = organizationWiseData[orgName]["Total Bonds Valuation"] / organizationWiseData[orgName]["Total Bonds Purchased"];
        } else {
            organizationWiseData[orgName] = {
                "Organization Name": orgName,
                "Total Bonds Purchased": 1,
                "Total Bonds Valuation": data["Denominations"],
                "Average Value Per Bond": data["Denominations"],
                "Party Donations": {},
                "Donations": {},
            }
        }
        organizationWiseData[orgName]["Donations"][data["Bond Number"]] = {
            "Reference No (URN)": data["Reference No  (URN)"],
            "Journal Date": new Date(data["Journal Date"]),
            "Date of Purchase": new Date(data["Date of Purchase"]),
            "Date of Expiry": new Date(data["Date of Expiry"]),
            "Prefix": data["Prefix"],
            "Bond Number": data["Bond Number"],
            "Denominations": data["Denominations"],
            "Issue Branch Code": data["Issue Branch Code"],
            "Issue Teller": data["Issue Teller"],
            "Status": data["Status"]
        }
    });

    partyBondData.forEach(data => {
        let partyName = data["Name of the Political Party"];
        if (bondData[data["Bond Number"]]) {
            bondData[data["Bond Number"]]["partyName"] = partyName;
        } else {
            bondData[data["Bond Number"]] = {
                partyName: partyName
            };
        }
        if (partyWiseData[partyName]) {
            partyWiseData[partyName]["Total Bonds Recieved"] += 1;
            partyWiseData[partyName]["Total Bonds Valuation"] += data["Denominations"];
            partyWiseData[partyName]["Average Value Per Bond"] = partyWiseData[partyName]["Total Bonds Valuation"] / partyWiseData[partyName]["Total Bonds Recieved"];
        } else {
            partyWiseData[partyName] = {
                "Political Party": partyName,
                "Total Bonds Recieved": 1,
                "Total Bonds Valuation": data["Denominations"],
                "Average Value Per Bond": data["Denominations"],
                "Organization Donations": {},
                "Donations": {}
            }
        }
        partyWiseData[partyName]["Donations"][data["Bond Number"]] = {
            "Date of Encashment": new Date(data["Date of Encashment"]),
            "Account no. of Political Party": data["Account no. of Political Party"],
            "Prefix": data["Prefix"],
            "Bond Number": data["Bond Number"],
            "Denominations": data["Denominations"],
            "Pay Branch Code": data["Pay Branch Code"],
            "Pay Teller": data["Pay Teller"],
            "Status": data["Status"]
        }
    });

    Object.keys(organizationWiseData).forEach(orgName => {
        Object.keys(organizationWiseData[orgName]["Donations"]).forEach(bondNumber => {
            let relatedPartyName = bondData[bondNumber]?.partyName;
            if (!relatedPartyName) return;
            organizationWiseData[orgName]["Donations"][bondNumber]["Recieving Party"] = relatedPartyName;
            if (organizationWiseData[orgName]["Party Donations"][relatedPartyName]) {
                organizationWiseData[orgName]["Party Donations"][relatedPartyName]["Total Donation Value"] += organizationWiseData[orgName]["Donations"][bondNumber]["Denominations"];
                organizationWiseData[orgName]["Party Donations"][relatedPartyName]["Total Bonds"] += 1;
                organizationWiseData[orgName]["Party Donations"][relatedPartyName]["Average Value Per Bond"] = organizationWiseData[orgName]["Party Donations"][relatedPartyName]["Total Donation Value"] / organizationWiseData[orgName]["Party Donations"][relatedPartyName]["Total Bonds"];
            }
            else {
                organizationWiseData[orgName]["Party Donations"][relatedPartyName] = {
                    "Political Party": relatedPartyName,
                    "Total Donation Value": organizationWiseData[orgName]["Donations"][bondNumber]["Denominations"],
                    "Total Bonds": 1,
                    "Average Value Per Bond": organizationWiseData[orgName]["Donations"][bondNumber]["Denominations"]
                }
            }
        });
    });

    Object.keys(partyWiseData).forEach(partyName => {
        Object.keys(partyWiseData[partyName]["Donations"]).forEach(bondNumber => {
            let relatedOrgName = bondData[bondNumber]?.orgName;
            if (!relatedOrgName) return;
            partyWiseData[partyName]["Donations"][bondNumber]["Donating Organization"] = relatedOrgName;
            if (partyWiseData[partyName]["Organization Donations"][relatedOrgName]) {
                partyWiseData[partyName]["Organization Donations"][relatedOrgName]["Total Donation Value"] += partyWiseData[partyName]["Donations"][bondNumber]["Denominations"];
                partyWiseData[partyName]["Organization Donations"][relatedOrgName]["Total Bonds"] += 1;
                partyWiseData[partyName]["Organization Donations"][relatedOrgName]["Average Value Per Bond"] = partyWiseData[partyName]["Organization Donations"][relatedOrgName]["Total Donation Value"] / partyWiseData[partyName]["Organization Donations"][relatedOrgName]["Total Bonds"];
            }
            else {
                partyWiseData[partyName]["Organization Donations"][relatedOrgName] = {
                    "Organization": relatedOrgName,
                    "Total Donation Value": partyWiseData[partyName]["Donations"][bondNumber]["Denominations"],
                    "Total Bonds": 1,
                    "Average Value Per Bond": partyWiseData[partyName]["Donations"][bondNumber]["Denominations"]
                }
            }
        });
    });

    return { organizationWiseData, partyWiseData };
}

const { organizationWiseData, partyWiseData } = Object.freeze(prepareData());
const PAGE_SIZE = 15;

function PartyOrgMapping() {
    const politicalParties = Object.keys(partyWiseData).sort();
    const [selectedParty, setSelectedParty] = useState(politicalParties[0]);
    const [pageNo, setPageNo] = useState(0);
    const [allOrgNames, setAllOrgNames] = useState(Object.values(partyWiseData[selectedParty]["Organization Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map((name, id) => {
        return { name: name["Organization"], id };
    }).slice(0, 5));

    function prepareSeriesFundingData() {
        let allDonors = {};
        // partyWiseData[partyName]["Donations"][data["Bond Number"]]["Date of Encashment"];
        allOrgNames.forEach(org => {
            allDonors[org.name] = 0;
        });

        // .sort((a,b) => a["Date of Encashment"] - b["Date of Encashment"])
        let allUniqueDates = [];
        Object.values(partyWiseData[selectedParty]["Donations"]).forEach(x => {
            let date = x["Date of Encashment"];
            let matching = allUniqueDates.find(x => x - date === 0);
            if (matching) return;
            allUniqueDates.push(date);
        });
        allUniqueDates.sort();
        let areaSeriesData = [];
        for (let date of allUniqueDates) {
            Object.keys(allDonors).forEach(donor => {
                let matchingBonds = Object.values(partyWiseData[selectedParty]["Donations"]).find(x => x["Donating Organization"] === donor && x["Date of Encashment"] - date === 0);
                if (matchingBonds) {
                    allDonors[donor] += matchingBonds["Denominations"];
                }
            });
            areaSeriesData.push({ ...allDonors, date });
        }
        console.log(areaSeriesData);
        return areaSeriesData;
    }

    useEffect(() => {
        setPageNo(0);
        setAllOrgNames(Object.values(partyWiseData[selectedParty]["Organization Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map((name, id) => {
            return { name: name["Organization"], id };
        }).slice(0, 5));
    }, [selectedParty]);

    function getCurrentPartyPage() {
        let data = [];
        let allDonors = Object.values(partyWiseData[selectedParty]["Organization Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map(x => {
            // x["Total Donation Value"] = currencyFormatter(x["Total Donation Value"]);
            // x["Average Value Per Bond"] = currencyFormatter(x["Average Value Per Bond"]);
            return {
                ...x,
                "Total Donation Value": currencyFormatter(x["Total Donation Value"]),
                "Average Value Per Bond": currencyFormatter(x["Average Value Per Bond"])
            };
        });
        let start = pageNo * PAGE_SIZE;
        for (let i = start; i < (start + PAGE_SIZE) && i < allDonors.length; i++) {
            data.push(allDonors[i]);
        }
        let finalTableData = {
            ...partyWiseData[selectedParty],
            "Organization Donations": data,
            "Total Bonds Valuation": currencyFormatter(partyWiseData[selectedParty]["Total Bonds Valuation"]),
            "Average Value Per Bond": currencyFormatter(partyWiseData[selectedParty]["Average Value Per Bond"])
            // "Donations": Object.values(partyWiseData[selectedParty]["Donations"]).sort((a,b) => b["Date of Encashment"] - a["Date of Encashment"])
        };
        delete finalTableData["Donations"];
        return <JsonToTable key={`${selectedParty}-${pageNo}`} json={finalTableData} />;
    }

    function nextPage() {
        let maxPageNo = Math.floor(Object.values(partyWiseData[selectedParty]["Organization Donations"]).length / PAGE_SIZE) - 1;
        if ((pageNo + 1) > maxPageNo) setPageNo(0);
        else setPageNo(pno => pno + 1);
    }
    function previousPage() {
        let maxPageNo = Math.floor(Object.values(partyWiseData[selectedParty]["Organization Donations"]).length / PAGE_SIZE) - 1;
        console.log(maxPageNo);
        setPageNo(pno => {
            if (pno === 0) return maxPageNo;
            else return pno - 1;
        });
    }

    function calculateTotalRecieved() {
        return Object.values(partyWiseData[selectedParty]["Organization Donations"]).map((org, idx) => {
            return {
                "Organization": org["Organization"],
                "Total Donation": org["Total Donation Value"],
                fill: rainbow(Object.keys(partyWiseData[selectedParty]["Organization Donations"]).length, idx)
            }
        });
    }

    return (
        <article>
            <h2>"{selectedParty}" - Donors</h2>
            <select style={{ marginBottom: 10 }} value={selectedParty} onChange={e => {
                e.preventDefault();
                setSelectedParty(e.target.value);
            }}>
                {politicalParties.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <summary>
                <button onClick={previousPage}>{"⬅️"}</button>
                <span style={{ margin: "0px 10px" }}>{pageNo + 1} / {Math.ceil(Object.values(partyWiseData[selectedParty]["Organization Donations"]).length / PAGE_SIZE) - 1}</span>
                <button onClick={nextPage}>{"➡️"}</button>
                <input width={100} type="range" min={0} max={Math.floor(Object.values(partyWiseData[selectedParty]["Organization Donations"]).length / PAGE_SIZE) - 1} step={1} value={pageNo} onChange={e => {
                    e.preventDefault();
                    setPageNo(parseInt(e.target.value));
                }} />
                {getCurrentPartyPage()}
            </summary>
            <Multiselect
                options={Object.keys(partyWiseData[selectedParty]["Organization Donations"]).map((name, id) => {
                    return { name, id };
                })} // Options to display in the dropdown
                selectedValues={allOrgNames} // Preselected value to persist in dropdown
                onSelect={(list) => list && list.length && setAllOrgNames(list)} // Function will trigger on select event
                onRemove={(list) => list && list.length && setAllOrgNames(list)} // Function will trigger on remove event
                displayValue="name" // Property name to display in the dropdown options
            />
            <ResponsiveContainer width="90%" height={600}>
                <AreaChart data={prepareSeriesFundingData()}>
                    <defs>
                        {Object.keys(partyWiseData[selectedParty]["Organization Donations"]).map((orgName, id) => (
                            <linearGradient key={`${orgName}-${id}`} id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={rainbow(Object.keys(partyWiseData[selectedParty]["Organization Donations"]).length, id + 1)} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={rainbow(Object.keys(partyWiseData[selectedParty]["Organization Donations"]).length, id + 1)} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v, n, p) => currencyFormatter(v)} />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    {allOrgNames.map(org => (
                        <Area key={`${org.name}-${org.id}`} type="monotone" dataKey={org.name} stroke={rainbow(Object.keys(partyWiseData[selectedParty]["Organization Donations"]).length, org.id + 1)} fillOpacity={1} fill={`url(#color${org.id})`} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="90%" height={600}>
                <PieChart>
                    <Pie cx="50%" data={calculateTotalRecieved()} dataKey="Total Donation" nameKey="Organization" />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    {/* <Legend verticalAlign="top" /> */}
                </PieChart>
            </ResponsiveContainer>
        </article>
    );
}

function OrgPartyMapping() {
    const organizations = Object.keys(organizationWiseData).sort();
    const [selectedOrg, setSelectedOrg] = useState(organizations[0]);
    const [pageNo, setPageNo] = useState(0);
    const [allPartyNames, setAllPartyNames] = useState(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map((name, id) => {
        return { name: name["Political Party"], id };
    }));

    useEffect(() => {
        setPageNo(0);
        setAllPartyNames(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map((name, id) => {
            return { name: name["Political Party"], id };
        }));
    }, [selectedOrg]);

    function nextPage() {
        let maxPageNo = Math.floor(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).length / PAGE_SIZE) - 1;
        if ((pageNo + 1) > maxPageNo) setPageNo(0);
        else setPageNo(pno => pno + 1);
    }
    function previousPage() {
        let maxPageNo = Math.floor(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).length / PAGE_SIZE) - 1;
        console.log(maxPageNo);
        setPageNo(pno => {
            if (pno === 0) return maxPageNo;
            else return pno - 1;
        });
    }

    function getCurrentOrgPage() {
        let data = [];
        let allDonors = Object.values(organizationWiseData[selectedOrg]["Party Donations"]).sort((a, b) => b["Total Donation Value"] - a["Total Donation Value"]).map(x => {
            // x["Total Donation Value"] = currencyFormatter(x["Total Donation Value"]);
            // x["Average Value Per Bond"] = currencyFormatter(x["Average Value Per Bond"]);
            return {
                ...x,
                "Total Donation Value": currencyFormatter(x["Total Donation Value"]),
                "Average Value Per Bond": currencyFormatter(x["Average Value Per Bond"])
            };
        });
        let start = pageNo * PAGE_SIZE;
        for (let i = start; i < (start + PAGE_SIZE) && i < allDonors.length; i++) {
            data.push(allDonors[i]);
        }
        let finalTableData = {
            ...organizationWiseData[selectedOrg],
            "Party Donations": data,
            "Total Bonds Valuation": currencyFormatter(organizationWiseData[selectedOrg]["Total Bonds Valuation"]),
            "Average Value Per Bond": currencyFormatter(organizationWiseData[selectedOrg]["Average Value Per Bond"])
            // "Donations": Object.values(partyWiseData[selectedParty]["Donations"]).sort((a,b) => b["Date of Encashment"] - a["Date of Encashment"])
        };
        delete finalTableData["Donations"];
        return <JsonToTable key={`${selectedOrg}-${pageNo}`} json={finalTableData} />;
    }

    function calculateTotalDonated() {
        return Object.values(organizationWiseData[selectedOrg]["Party Donations"]).map((party, idx) => {
            return {
                "Political Party": party["Political Party"],
                "Total Donation": party["Total Donation Value"],
                fill: rainbow(Object.keys(organizationWiseData[selectedOrg]["Party Donations"]).length, idx)
            }
        });
    }

    return (
        <article>
            <h2>"{selectedOrg}" - Donations</h2>
            <select style={{ marginBottom: 10 }} value={selectedOrg} onChange={e => {
                e.preventDefault();
                setSelectedOrg(e.target.value);
            }}>
                {organizations.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <summary>
                <button onClick={previousPage}>{"⬅️"}</button>
                <span style={{ margin: "0px 10px" }}>{pageNo + 1} / {Math.ceil(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).length / PAGE_SIZE)}</span>
                <button onClick={nextPage}>{"➡️"}</button>
                <input width={100} type="range" min={0} max={Math.floor(Object.values(organizationWiseData[selectedOrg]["Party Donations"]).length / PAGE_SIZE) - 1} step={1} value={pageNo} onChange={e => {
                    e.preventDefault();
                    setPageNo(parseInt(e.target.value));
                }} />
                {getCurrentOrgPage()}
            </summary>
            <ResponsiveContainer width="90%" height={600}>
                <PieChart>
                    <Pie cx="50%" data={calculateTotalDonated()} dataKey="Total Donation" nameKey="Political Party" />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    {/* <Legend verticalAlign="top" /> */}
                </PieChart>
            </ResponsiveContainer>
        </article>
    )
}

export default function PartyOrgRelation() {
    return (
        <>
            <PartyOrgMapping />
            <OrgPartyMapping />
        </>
    );
}