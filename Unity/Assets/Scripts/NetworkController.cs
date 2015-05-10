using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using System.Collections.Generic;
using SocketIO;

public class NetworkController : MonoBehaviour{
	public GameController gc;
	private GlobalState gs;
	private SocketIOComponent socket;

	void Start () {
		//Get connection instances
		gs = GameObject.FindWithTag ("GlobalState").GetComponent<GlobalState>();
		socket = gs.socket;

		EventHandler ();
		socket.Emit("game ready");

	}

	void Update () {

	}


	public void request(string type, Dictionary<string,JSONObject> data){
		socket.Emit (type, new JSONObject (data));
	}

	public void request(string type){
		socket.Emit (type);
	}


	//** Handle Socket Game Events**//
	public void EventHandler(){
		socket.On ("game loaded", gc.startGame);
		socket.On ("player data", gc.setupPlayers);
		socket.On ("submit action", gc.submitAction);
		socket.On ("action start", gc.actionStart);
		socket.On ("end action", gc.actionEnd);
		socket.On ("all actions done", gc.nextTurn);
		socket.On ("game over", gc.endGame);
	}

	public void KillEventHandler(){
		socket.Off ("game loaded", gc.startGame);
		socket.Off ("player data", gc.setupPlayers);
		socket.Off ("submit action", gc.submitAction);
		socket.Off ("action start", gc.actionStart);
		socket.Off ("end action", gc.actionEnd);
		socket.Off ("all actions done", gc.nextTurn);
		socket.Off ("game over", gc.endGame);
	}

	
}
