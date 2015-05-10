using UnityEngine;
using System.Collections;

public class CombatStats : MonoBehaviour {

	//Player 1 stats
	public Meter p1health;
	public Meter p1resource;

	//Player 2 stats
	public Meter p2health;
	public Meter p2resource;


	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	public void changeStat(bool mine,bool health,float val){
		if (mine) {
			if (health) {
				p1health.changeValue (val);
			} else {
				p1resource.changeValue (val);
			}
		} else {
			if (health) {
				p2health.changeValue (val);
			} else {
				p2resource.changeValue (val);
			}
		}
	}

	public void setupStats(int p1Type, float p1HP, float p1Res, int p2Type, float p2HP, float p2Res){
		p1health.setMax (p1HP);
		p2health.setMax (p2HP);
		p1resource.setType (p1Type);
		p2resource.setType (p2Type);
		p1resource.setMax (p1Res);
		p1resource.setMax (p2Res);

	}

	public void setupStats(bool mine, float hp){
		if (mine) {
			p1health.setMax (hp);
		} else {
			p2health.setMax (hp);
		}
		
	}


}
