using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class RedRectangle : Hero {
	// Use this for initialization
	new void Start () {
		base.Start ();
	}
	
	// Update is called once per frame
	void Update () {

	}
	
	public override void HandleAbility(float index, float data){
		switch (Mathf.FloorToInt(index)){
		case 0: //Standard Attack
			StandardAttack(data);
			break;
		}
	}
	
	
	//***Abilities***//
	public void StandardAttack(float data){
		animator.SetTrigger ("StartPlaceholder");
		
	}
	
	
	
	
}

