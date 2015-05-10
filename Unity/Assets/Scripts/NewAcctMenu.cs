using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SocketIO;
using UnityEngine.UI;

public class NewAcctMenu : Menu {
	public Dictionary<string,JSONObject> tempData = new Dictionary<string,JSONObject>();

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}


	//**Page 0**//
	public InputField nameField;
	public string selectedName;

	public void nameCallback(bool good){
		if (good) {
			turnPage (1);
		}
	}

	public void sendName(){
		selectedName = nameField.text;
		welcomeTitle.text = "Welcome, " + selectedName + ".";
		mc.validateNameRequest (selectedName);
	}

	//**Page 1**//
	public InputField emailField;
	public string selectedEmail;
	public Text welcomeTitle;

	public void emailCallback(bool good){
		if (good) {
			turnPage(2);
		}
	}

	public void sendEmail(){
		selectedEmail = emailField.text;
		mc.validateEmailRequest (selectedEmail);
	}

	//**Page 2**//
	public void acceptAlpha(){
		pickHero (0);
		turnPage (3);
	}

	//**Page 3**//
	public int pickedHero;
	public Image selectCursor;

	public void pickHero(int heroNum){
		switch (heroNum) {
			case 0:
				selectCursor.transform.localPosition = new Vector3(-100,-60,0);
			break;

			case 1:
				selectCursor.transform.localPosition = new Vector3(218,-60,0);
			break;

			case 2:
			break;
		}

		pickedHero = heroNum;
	}

	public void selectHero(){
		submitAccountInfo ();
		turnPage (4);
	}

	//**Page 4**//
	public Text acctProgress;
	public Button enterGame;

	public void makeAccountCallback(string sbID, bool good){
		if (good) {
			acctProgress.text = "Success!";
			PlayerPrefs.SetString("sbID",sbID);
			enterGame.gameObject.SetActive(true);
		} else {
			acctProgress.text = "Something failed.";
		}
	}

	public void submitAccountInfo(){
		mc.makeAccountRequest (selectedName, selectedEmail, pickedHero);
	}

	public void finishSetup(){
		mc.finishSetup ();
	}

















}
