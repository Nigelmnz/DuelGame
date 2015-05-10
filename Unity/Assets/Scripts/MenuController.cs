using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SocketIO;
using UnityEngine.UI;

public class MenuController : MonoBehaviour {
	public GlobalState gsPrefab;
	public GlobalState gs;
	public MenuNetworkController net;
	public bool skipToGame;
	

	//**UI Stuff**//
	public float sendTime;

	//**Menus**//
	public NewAcctMenu newAcctMenu;
	public MainMenu mainMenu;
	public LoadoutMenu loadoutMenu;

	//**Data Store**/
	public Dictionary<string,JSONObject> newAcctData = new Dictionary<string,JSONObject>();

	//**Connection**//
	
	void Start () {
		if (GameObject.FindGameObjectsWithTag ("GlobalState").Length == 0) {
			gs = Instantiate (gsPrefab);
		} else {
			gs = GameObject.FindGameObjectsWithTag ("GlobalState")[0].GetComponent<GlobalState>();;
		}

		if (gs.connectedToServer) {
			startRunningGame();
		}
	}

	void Update () {
		if (!gs.connectedToServer) {
			ping ();
		}
	}

	void startRunningGame(){

		if (gs.loggedIn) {
			mainMenu.openMenu (0);
		}else if(PlayerPrefs.HasKey("sbID")){
			//All good, start game
			Debug.Log(PlayerPrefs.GetString("sbID"));
			loginRequest();
		}else{
			//Start acct creation
			newAcctMenu.openMenu(0);
		}



	}

	public void findGameRequest(){
		if(net.socket.IsConnected){
			Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"num",jsOB("adsa")}};
			net.request ("find game", data);
		}

	}

	public void cancelFindGameRequest(){
		if(net.socket.IsConnected){
			Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"num",jsOB("adsa")}};
			net.request ("cancel find game", data);
		}
		
	}

	public void ping(){
		sendTime = Time.time;
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"num",jsOB("adsa")}};
		net.request ("ping",data);
	}


	public void pingBack(SocketIOEvent e){
		if (!gs.connectedToServer) {
			gs.connectedToServer = true;
			startRunningGame ();
		}
	}

	public void joinGame(SocketIOEvent e){
		net.KillEventHandler ();
		Application.LoadLevel ("Battle");
	}


	//**Account Creation Stuff**//
	public void validateNameRequest(string name){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"name",jsOB(name)}};
		net.request ("validate name", data);
	}


	public void nameCallback(SocketIOEvent e){
		newAcctMenu.nameCallback ((bool) get (e,"success"));
	
	}

	public void validateEmailRequest(string name){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"email",jsOB(name)}};
		net.request ("validate email", data);
	}
	
	
	public void emailCallback(SocketIOEvent e){
		newAcctMenu.emailCallback ((bool) get (e,"success"));
		
	}

	public void makeAccountRequest(string name, string email, int character){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"name",jsOB(name)},{"email",jsOB(email)},{"characterSelect",jsOB(character)}};
		net.request ("make account", data);
	}
	
	
	public void makeAccountCallback(SocketIOEvent e){
		newAcctMenu.makeAccountCallback ((string)get (e,"sbID"),(bool) get (e,"success"));
	}

	public void finishSetup(){
		newAcctMenu.closeMenu ();
		loginRequest();
	}

	//**Primary Menu Stuff**//
	public void loginRequest(){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"sbID",jsOB(PlayerPrefs.GetString("sbID"))}};
		net.request ("login", data);
	}

	public void loginCallback(SocketIOEvent e){
		if ((bool)get (e, "success")) {
			gs.loggedIn = true;
			mainMenu.openMenu (0);
		} else {
			Debug.Log("Login Failed" + e);
			switch(Mathf.FloorToInt((float)get (e, "errorCode"))){
				case 100: //Ill action
					break;

				case 200: //Db error
					break;

				case 301: //No acct
					//Start acct creation
					newAcctMenu.openMenu(0);
					break;
			}
		}
	}

	public void playGameRequest(){
		//TODO:: Have server check if you have the proper version
	
	}

	public void loadoutRequest(Menu sendback){
		Dictionary<string,JSONObject> data = new Dictionary<string,JSONObject> {{"sbID",jsOB(PlayerPrefs.GetString("sbID"))}};
		net.request ("query loadouts", data);

	}

	public void loadoutCallback(SocketIOEvent e){
		//TODO:: Implement
	}

	//**Loadout Editing**//
	public void enterLoadout(){
		loadoutMenu.openMenu (0);
		mainMenu.closeMenu ();
	}

	public void exitLoadout(){
		mainMenu.openMenu (0);
		loadoutMenu.closeMenu ();
	}



	//**JSON Helper Functions**//

	public void debugMessage(SocketIOEvent e){
		Debug.Log (e);
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
