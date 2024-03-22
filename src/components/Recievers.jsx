import { useState } from "react";
import { JsonToTable } from "react-json-to-table";
import { ResponsiveContainer, XAxis, Line, YAxis, Tooltip, Legend, LineChart, PieChart, Pie } from 'recharts';
import recieverData from "../datasource/parsedparties.json";
import { useEffect } from "react";
import { rainbow, currencyFormatter } from "../utils";

function calculateTotalRecieved() {
    let orgPurchase = {};
    // console.log(purchaserData.length);
    recieverData.forEach(data => {
        if (orgPurchase[data["Name of the Political Party"]]) {
            orgPurchase[data["Name of the Political Party"]] += data["Denominations"];
        } else {
            orgPurchase[data["Name of the Political Party"]] = data["Denominations"];
        }
    });
    return Object.keys(orgPurchase).map((x, idx) => {
        return { name: x, "Total Amount": orgPurchase[x], fill: rainbow(Object.keys(orgPurchase).length, idx) }
    });
}

function calculateRecievedSummary() {
    let orgPurchase = {};
    // console.log(purchaserData.length);
    recieverData.forEach(data => {
        if (orgPurchase[data["Name of the Political Party"]]) {
            orgPurchase[data["Name of the Political Party"]]["Total Amount"] += data["Denominations"];
            orgPurchase[data["Name of the Political Party"]]["Bonds"].push({
                "Date of Encashment": data["Date of Encashment"],
                "Bond Number": data["Bond Number"],
                "Denominations": data["Denominations"],
                "Bond Number": data["Bond Number"],
                "Pay Teller": data["Pay Teller"]
            });
        } else {
            orgPurchase[data["Name of the Political Party"]] = {
                "Total Amount": data["Denominations"],
                "Bond Count": 0,
                "Average Bond Value": 0,
                "Bonds": [{
                    "Date of Encashment": data["Date of Encashment"],
                    "Bond Number": data["Bond Number"],
                    "Denominations": data["Denominations"],
                    "Bond Number": data["Bond Number"],
                    "Pay Teller": data["Pay Teller"]
                }]
            };
        }
    });
    Object.keys(orgPurchase).forEach(key => {
        orgPurchase[key]["Bonds Count"] = orgPurchase[key]["Bonds"].length;
        orgPurchase[key]["Average Bond Value"] = orgPurchase[key]["Total Amount"] / orgPurchase[key]["Bonds Count"];
    });
    return orgPurchase;
}

const PAGE_SIZE = 12;

function Totals() {
    const totalRecieved = calculateTotalRecieved().sort((a, b) => b["Total Amount"] - a["Total Amount"]);
    return (
        <article>
            <h2>Total Recieved by Political Party</h2>
            <ResponsiveContainer width="90%" height={600}>
                <PieChart>
                    <Pie cx="50%" data={totalRecieved} dataKey="Total Amount" nameKey="name" />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    {/* <Legend verticalAlign="top" /> */}
                </PieChart>
            </ResponsiveContainer>
        </article>
    )
}

function Summary() {
    const recievedSummary = calculateRecievedSummary();
    const partyNames = Object.keys(recievedSummary).sort();
    const [partySelected, setSelectedParty] = useState(partyNames[0]);
    const [pageNo, setPageNo] = useState(0);

    useEffect(() => {
        setPageNo(0);
    }, [partySelected]);

    function getCurrentDataPage() {
        let data = [];
        let start = pageNo * PAGE_SIZE;
        for (let i = start; i < (start + PAGE_SIZE) && i < recievedSummary[partySelected]["Bonds"].length; i++) {
            data.push(recievedSummary[partySelected]["Bonds"][i]);
        }
        let finalTableData = {
            ...recievedSummary[partySelected],
            "Bonds": data
        };
        finalTableData = {
            "Total Amount": currencyFormatter(finalTableData["Total Amount"]),
            "Bonds Count": recievedSummary[partySelected]["Bonds"].length,
            "Average Bond Value": currencyFormatter(finalTableData["Average Bond Value"]),
            "Bonds": finalTableData["Bonds"].map(x => {
                return {
                    ...x,
                    "Denominations": currencyFormatter(x["Denominations"])
                }
            })
        }
        return <JsonToTable key={`${partySelected}.${pageNo}`} json={finalTableData} />;
    }
    function nextPage() {
        let maxPageNo = Math.floor(recievedSummary[partySelected]["Bonds"].length / PAGE_SIZE) - 1;
        if ((pageNo + 1) > maxPageNo) setPageNo(0);
        else setPageNo(pno => pno + 1);
    }
    function previousPage() {
        let maxPageNo = Math.floor(recievedSummary[partySelected]["Bonds"].length / PAGE_SIZE) - 1;
        console.log(maxPageNo);
        setPageNo(pno => {
            if (pno === 0) return maxPageNo;
            else return pno - 1;
        });
    }

    return (
        <article>
            <h2>Donation Summary For "{partySelected}"</h2>
            <select style={{ marginBottom: 10 }} value={partySelected} onChange={e => {
                e.preventDefault();
                setSelectedParty(e.target.value);
            }}>
                {partyNames.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            
            <summary style={{ marginBottom: 20 }}>
                <button onClick={previousPage}>{"⬅️"}</button>
                <span style={{ margin: "0px 10px" }}>{pageNo + 1} / {Math.ceil(recievedSummary[partySelected]["Bonds"].length / PAGE_SIZE) - 1}</span>
                <button onClick={nextPage}>{"➡️"}</button>
                <input width={100} type="range" min={0} max={Math.floor(recievedSummary[partySelected]["Bonds"].length / PAGE_SIZE) - 1} step={1} value={pageNo} onChange={e => {
                    e.preventDefault();
                    setPageNo(parseInt(e.target.value));
                }} />
                {getCurrentDataPage()}
            </summary>
            <ResponsiveContainer width="90%" height={300}>
                <LineChart data={recievedSummary[partySelected]["Bonds"]}>
                    <XAxis allowDuplicatedCategory={false} dataKey="Date of Encashment" />
                    <YAxis tickFormatter={(v, n, p) => currencyFormatter(v)} />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Denominations" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </article>
    );
}

function Recievers() {
    return (
        <>
            <Totals />
            <Summary />
        </>
    )
}

export default Recievers;