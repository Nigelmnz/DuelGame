using UnityEngine;
using System.Collections;
using SocketIO;

public class GlobalState : MonoBehaviour {
	public SocketIOComponent socket;
	public bool loggedIn;
	public bool connectedToServer = false;

	void Start () {
		if (!connectedToServer) {
			socket.Connect ();
			loggedIn = false;
		}
	}

	void Awake() {
		DontDestroyOnLoad(this);
	}
}

