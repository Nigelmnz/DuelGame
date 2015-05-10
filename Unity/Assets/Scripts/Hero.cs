using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class Hero : MonoBehaviour {
	public SpriteRenderer heroBody;
	public Animator animator;
	public bool isMyHero;
	public Event[] eventCollection;
	public GameController GC;
	public JSONObject heroData;
	
	// Use this for initialization
	public void Start () {
		GC = GameObject.FindGameObjectWithTag ("GameController").GetComponent<GameController>();
		
		if (isMyHero) {
			transform.position = new Vector3(-14f,-6f,0f);
			transform.localScale = new Vector3(2.5f,2.5f,1f);
		}else{
			transform.position = new Vector3(13f,-6f,0f);
			transform.localScale = new Vector3(-2.5f,2.5f,1f);
		}
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	public void Init(bool isMe, JSONObject data){
		isMyHero = isMe;
		heroData = data;
		Start ();

	}

	public virtual void HandleAbility (float index, float data){}

	public void animationDone(){
		Debug.Log("Animation finished");
		GC.requestActionEnd();
		
	}



}
