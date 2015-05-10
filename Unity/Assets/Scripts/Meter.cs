using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class Meter : MonoBehaviour {
	public float value;
	public float maxValue;
	public Image fill;
	public Slider slider;
	public SpriteRenderer meterRenderer;
	public Sprite[] statSprites;
	public int type;
	public Text textValue;

	// Use this for initialization
	void Start () {
		setType (type);
	}

	public void setType(int type){

		switch(type){
		case 0: //Health
			fill.color = new Color32(170,17,51,255); 
			break;
		case 1: //Mana
			fill.color = new Color32(102,32,153,255);
			break;
		case 2: //Energy
			fill.color = new Color32(203,186,35,255);	
			break;
		}

		//Set stat image
		meterRenderer.sprite = statSprites [type];
	}
	
	// Update is called once per frame
	void Update () {
		slider.value = value / maxValue;
		textValue.text = Mathf.FloorToInt (value) + "/" + Mathf.FloorToInt (maxValue);
	}

	public void changeValue(float change){;
		value += change;
	}

	public void setMax(float max){
		maxValue = max;
		value = max;
	}
}
