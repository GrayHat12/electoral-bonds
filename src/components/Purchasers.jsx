import { useState } from "react";
import { JsonToTable } from "react-json-to-table";
import { BarChart, ResponsiveContainer, XAxis, Line, YAxis, Tooltip, Legend, Bar, LineChart } from 'recharts';
import purchaserData from "../datasource/parsedpurchasers.json";
import { useEffect } from "react";
import { rainbow, currencyFormatter } from "../utils";

function calculateTotalPurchases() {
    let orgPurchase = {};
    // console.log(purchaserData.length);
    purchaserData.forEach(data => {
        if (orgPurchase[data["Name of the Purchaser"]]) {
            orgPurchase[data["Name of the Purchaser"]] += data["Denominations"];
        } else {
            orgPurchase[data["Name of the Purchaser"]] = data["Denominations"];
        }
    });
    return Object.keys(orgPurchase).map((x, idx) => {
        return { name: x, "Total Amount": orgPurchase[x], fill: rainbow(Object.keys(orgPurchase).length, idx) }
    });
}

function calculatePurchasesSummary() {
    let orgPurchase = {};
    // console.log(purchaserData.length);
    purchaserData.forEach(data => {
        if (orgPurchase[data["Name of the Purchaser"]]) {
            orgPurchase[data["Name of the Purchaser"]]["Total Amount"] += data["Denominations"];
            orgPurchase[data["Name of the Purchaser"]]["Purchases"].push({
                "Journal Date": data["Journal Date"],
                "Date of Purchase": data["Date of Purchase"],
                "Date of Expiry": data["Date of Expiry"],
                "Bond Number": data["Bond Number"],
                "Reference No (URN)": data["Reference No  (URN)"],
                "Denominations": data["Denominations"]
            });
        } else {
            orgPurchase[data["Name of the Purchaser"]] = {
                "Total Amount": data["Denominations"],
                "Donation Count": 0,
                "Average Donation": 0,
                "Purchases": [{
                    "Journal Date": data["Journal Date"],
                    "Date of Purchase": data["Date of Purchase"],
                    "Date of Expiry": data["Date of Expiry"],
                    "Bond Number": data["Bond Number"],
                    "Reference No (URN)": data["Reference No  (URN)"],
                    "Denominations": data["Denominations"]
                }]
            };
        }
    });
    Object.keys(orgPurchase).forEach(key => {
        orgPurchase[key]["Donation Count"] = orgPurchase[key]["Purchases"].length;
        orgPurchase[key]["Average Donation"] = orgPurchase[key]["Total Amount"] / orgPurchase[key]["Donation Count"];
    });
    return orgPurchase;
}

const PAGE_SIZE = 20;

function Totals() {
    const [pageNo, setPageNo] = useState(0);
    const totalPurchases = calculateTotalPurchases().sort((a, b) => b["Total Amount"] - a["Total Amount"]);
    function getCurrentDataPage() {
        let data = [];
        let start = pageNo * PAGE_SIZE;
        for (let i = start; i < (start + PAGE_SIZE) && i < totalPurchases.length; i++) {
            data.push(totalPurchases[i]);
        }
        return data;
    }
    function nextPage() {
        let maxPageNo = Math.floor(totalPurchases.length / PAGE_SIZE) - 1;
        if ((pageNo + 1) > maxPageNo) setPageNo(0);
        else setPageNo(pno => pno + 1);
    }
    function previousPage() {
        let maxPageNo = Math.floor(totalPurchases.length / PAGE_SIZE) - 1;
        console.log(maxPageNo);
        setPageNo(pno => {
            if (pno === 0) return maxPageNo;
            else return pno - 1;
        });
    }
    return (
        <article>
            <h2>Total Purchased by Organization</h2>
            <button onClick={previousPage}>{"⬅️"}</button>
            <span style={{ margin: "0px 10px" }}>{pageNo + 1} / {Math.floor(totalPurchases.length / PAGE_SIZE)}</span>
            <button onClick={nextPage}>{"➡️"}</button>
            <input width={100} type="range" min={0} max={Math.floor(totalPurchases.length / PAGE_SIZE) - 1} step={1} value={pageNo} onChange={e => {
                e.preventDefault();
                setPageNo(parseInt(e.target.value));
            }} />
            <ResponsiveContainer width="90%" height={400}>
                <BarChart data={getCurrentDataPage()}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v, n, p) => currencyFormatter(v)} />
                    {/* <YAxis dataKey="name" type="category" />
                    <YAxis orientation='right' dataKey="Total Amount" type="category" /> */}
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="Total Amount" fill="#8884d8" />
                    {/* {totalPurchases.map((data, index) => <Cell key={index} fill="red" />)} */}
                    {/* </Bar> */}
                </BarChart>
            </ResponsiveContainer>
        </article>
    )
}

function Summary() {
    const purchaseSummary = calculatePurchasesSummary();
    const orgNames = Object.keys(purchaseSummary).sort();
    const [orgSelected, setSelectedOrg] = useState(orgNames[0]);
    const [pageNo, setPageNo] = useState(0);

    useEffect(() => {
        setPageNo(0);
    }, [orgSelected]);

    function getCurrentDataPage() {
        let data = [];
        let start = pageNo * PAGE_SIZE;
        for (let i = start; i < (start + PAGE_SIZE) && i < purchaseSummary[orgSelected]["Purchases"].length; i++) {
            data.push(purchaseSummary[orgSelected]["Purchases"][i]);
        }
        let finalTableData = {
            ...purchaseSummary[orgSelected],
            "Purchases": data
        };
        finalTableData = {
            "Total Amount": currencyFormatter(finalTableData["Total Amount"]),
            "Donation Count": purchaseSummary[orgSelected]["Purchases"].length,
            "Average Donation": currencyFormatter(finalTableData["Average Donation"]),
            "Purchases": finalTableData["Purchases"].map(x => {return {
                ...x,
                "Denominations": currencyFormatter(x["Denominations"])
            }})
        }
        return <JsonToTable key={`${orgSelected}.${pageNo}`} json={finalTableData} />;
    }
    function nextPage() {
        let maxPageNo = Math.floor(purchaseSummary[orgSelected]["Purchases"].length / PAGE_SIZE) - 1;
        if ((pageNo + 1) > maxPageNo) setPageNo(0);
        else setPageNo(pno => pno + 1);
    }
    function previousPage() {
        let maxPageNo = Math.floor(purchaseSummary[orgSelected]["Purchases"].length / PAGE_SIZE) - 1;
        console.log(maxPageNo);
        setPageNo(pno => {
            if (pno === 0) return maxPageNo;
            else return pno - 1;
        });
    }

    return (
        <article>
            <h2>Purchase Summary For "{orgSelected}"</h2>
            <select style={{marginBottom: 10}} value={orgSelected} onChange={e => {
                e.preventDefault();
                setSelectedOrg(e.target.value);
            }}>
                {orgNames.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <summary style={{marginBottom: 20}}>
                <button onClick={previousPage}>{"⬅️"}</button>
                <span style={{ margin: "0px 10px" }}>{pageNo + 1} / {Math.ceil(purchaseSummary[orgSelected]["Purchases"].length / PAGE_SIZE)}</span>
                <button onClick={nextPage}>{"➡️"}</button>
                <input width={100} type="range" min={0} max={Math.floor(purchaseSummary[orgSelected]["Purchases"].length / PAGE_SIZE) - 1} step={1} value={pageNo} onChange={e => {
                    e.preventDefault();
                    setPageNo(parseInt(e.target.value));
                }} />
                {getCurrentDataPage()}
            </summary>
            <ResponsiveContainer width="90%" height={300}>
                <LineChart data={purchaseSummary[orgSelected]["Purchases"]}>
                    <XAxis allowDuplicatedCategory={false} dataKey="Date of Purchase" />
                    <YAxis tickFormatter={(v, n, p) => currencyFormatter(v)} />
                    <Tooltip formatter={(v, n, p) => currencyFormatter(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Denominations" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </article>
    );
}

function Purchasers() {
    return (
        <>
            <Totals />
            <Summary />
        </>
    )
}

export default Purchasers;