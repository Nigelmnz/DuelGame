using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SocketIO;
using UnityEngine.UI;
using System; 

public class GameController : MonoBehaviour {
	public static GlobalState gs;
	public NetworkController net;
	public Board board;
	public EventRenderer ER;

	//**Client Game State**//
	private int selection;
	public string curActionID;

	//**GUI**//
	public ResultOverlay resultOverlay;
	public Panel UIPanel;
	public CombatStats combatStats;
	public Image screenCover;

	//**Heroes**//
	public Hero[] heroObjs;
	public Hero myHero;
	public Hero oppHero;

	//**Loading Checking**//
	bool myPlayerLoaded = false;
	bool oppPlayerLoaded = false;

	void Start () {
	}

	void Update(){
	}


	//**Game Setup**//
	//Called at the beginning of the game to set everything up
	public void setupPlayers(SocketIOEvent e){

		if (isMe (e)) {
			int heroN = Mathf.FloorToInt((float)get (e, "character"));
			myHero = Instantiate(heroObjs[heroN]);
			myHero.transform.SetParent(board.transform);
			myHero.Init(true,e.data);
			//setup bars TODO:: Have all stats
			combatStats.setupStats(true, (float)get (e, "health"));
//			Debug.Log("me" + (float)get (e, "health"));

			myPlayerLoaded = true;

		} else {
			int heroN = Mathf.FloorToInt((float)get (e, "character"));
			oppHero = Instantiate(heroObjs[heroN]);
			oppHero.transform.SetParent(board.transform);
			oppHero.Init(false,e.data);

			//setup bars TODO:: Have all stats
			combatStats.setupStats(false, (float)get (e, "health"));
//			Debug.Log("them" + (float)get (e, "health"));

			oppPlayerLoaded = true;
		}
		

		if (myPlayerLoaded && oppPlayerLoaded) {
			Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {};
			net.request("game loaded", data);
		}
		
	}


	public void startGame(SocketIOEvent e){
		screenCover.gameObject.SetActive (false);
	
	}

	//*** Server Requests ***//
	public void confirmAndParseAction(){
		int action = UIPanel.selectedButton;
	
		switch (action) {
		case 0:
			//attack
			requestSubmitAction(0);
			break;
		case 1:
			//defend
			break;
		}
	
	}

	public void requestSubmitAction(float action){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"index",jsOB(action)}};
		net.request("submit action", data);
	}
	
	public void requestActionEnd(){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"actionID", jsOB(curActionID)}};
		net.request("end action", data);
	}

	//*** Client Commands ***//

	public void submitAction(SocketIOEvent e){
		if (isMe (e)) {
			UIPanel.gameObject.SetActive (false);
		}
	}

	public void actionStart(SocketIOEvent e){
		curActionID = (string)get(e, "actionID");
		float index = (float)get(e, "index");
		float data = 0f;
		float damage = (float)get(e, "damage");

		//Perform Animation
		if (isMe (e)) {
			myHero.HandleAbility(index,data);
		}else{
			oppHero.HandleAbility(index,data);	
		}

		//Deal Damage
		combatStats.changeStat (!isMe (e), true, -1 * damage);
	}


	public void actionEnd(SocketIOEvent e){
		Debug.Log ("Got action end");
		
	}

	public void nextTurn(SocketIOEvent e){
		UIPanel.gameObject.SetActive (true);
		
	}

	public void endGame(SocketIOEvent e){
		string result = (string)get(e, "result");

		if (result == "draw") {
			resultOverlay.message.text = "Draw";
		} else {
			if((bool)(get(e,"me"))){
				resultOverlay.message.text = "You Lose";
			}else{
				resultOverlay.message.text = "You Win";
			}
		}

		resultOverlay.gameObject.SetActive (true);
	}

	public void loadStartMenu(){
		Destroy(this);
		net.KillEventHandler ();
		Application.LoadLevel ("Menu");
	}
	
	public dynamic get(SocketIOEvent e, string field){
		JSONObject getData = e.data.GetField (field); 
		switch (getData.type.ToString()) {
		case "STRING":		
			return getData.str;	
		case "NUMBER":
			return getData.n;
		case "BOOL":
			return getData.b;
		case "ARRAY":
			return getData.list.ToArray();
		case "OBJECT":
			return getData;
		case "NULL":
			return null;
		default:
			return null;
		}

	}

	public dynamic get(JSONObject o, string field){
		JSONObject getData = o.GetField (field); 
		switch (getData.type.ToString()) {
		case "STRING":		
			return getData.str;	
		case "NUMBER":
			return getData.n;
		case "BOOL":
			return getData.b;
		case "ARRAY":
			return getData.list.ToArray();
		case "OBJECT":
			return getData;
		case "NULL":
			return null;
		default:
			return null;
		}
		
	}
	

	public bool isMe(SocketIOEvent e){
		return (bool)get (e, "me");
	}

	public JSONObject jsOB(float x){
		return JSONObject.Create (x);
	}
	public JSONObject jsOB(bool x){
		return JSONObject.Create (x);
	}
	public JSONObject jsOB(int x){
		return JSONObject.Create (x);
	}
	public JSONObject jsOB(string x){
		return JSONObject.CreateStringObject (x);
	}

}


