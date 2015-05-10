using UnityEngine;
using System.Collections;

public class MainMenu : Menu {

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	//Page 0//
	public void playGameButton(){
		mc.loadoutRequest (this);
		turnPage (1);
	}

	//Page 1//
	public void findGameButton(){
		mc.findGameRequest ();
		turnPage (2);
	}

	public void backButton(){
		turnPage (0);
	}

	//Page 2//
	public void cancelFindGameButton(){
		mc.cancelFindGameRequest ();
		turnPage (1);
	}

	public void test(){
		Debug.Log ("asdas");
	}
}
