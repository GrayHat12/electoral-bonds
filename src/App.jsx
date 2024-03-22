import PartyOrgRelation from "./components/OrgPartyLink";
import Purchasers from "./components/Purchasers";
import Recievers from "./components/Recievers";

function App() {
	return (
		<>
			<section>
				<h1>Purchaser Stats</h1>
				<Purchasers />
			</section>
			<section>
				<h1>Reciever Stats</h1>
				<Recievers />
			</section>
			<section>
				<h1>Organization - Party Relation</h1>
				<PartyOrgRelation />
			</section>
		</>
	)
}

export default App;