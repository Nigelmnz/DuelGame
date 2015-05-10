using UnityEngine;
using System.Collections;
using SocketIO;
using System.Collections.Generic;

public class MenuNetworkController : MonoBehaviour {
	public MenuController mc;
	public SocketIOComponent socket;
	public GlobalState gs;

	// Use this for initialization
	void Start () {
		//Get connection instance
		gs = GameObject.FindWithTag ("GlobalState").GetComponent<GlobalState>();
		socket = gs.socket;

		EventHandler ();

	}
	
	// Update is called once per frame
	void Update () {
		
	}

	public void request(string type, Dictionary<string,JSONObject> data){
		socket.Emit (type, new JSONObject (data));
	}

	//** Handle Socket Game Events**//
	public void EventHandler(){
		socket.On ("join game", mc.joinGame);
		socket.On ("ping", mc.pingBack);
		socket.On ("debug", mc.debugMessage);

		//New Acct Menu
		socket.On ("validate name", mc.nameCallback);
		socket.On ("validate email", mc.emailCallback);
		socket.On ("make account", mc.makeAccountCallback);
		socket.On ("login", mc.loginCallback);

		//Menu
		socket.On ("query loadouts", mc.loadoutCallback);
	}

	public void KillEventHandler(){
		socket.Off ("join game", mc.joinGame);
		socket.Off ("ping", mc.pingBack);
		socket.Off ("debug", mc.debugMessage);
		
		//New Acct Menu
		socket.Off ("validate name", mc.nameCallback);
		socket.Off ("validate email", mc.emailCallback);
		socket.Off ("make account", mc.makeAccountCallback);
		socket.Off ("login", mc.loginCallback);
		
		//Menu
		socket.Off ("query loadouts", mc.loadoutCallback);
	}
	
}
