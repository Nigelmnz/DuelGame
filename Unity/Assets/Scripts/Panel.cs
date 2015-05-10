using UnityEngine;
using System.Collections;
using UnityEngine.UI;
public class Panel : MonoBehaviour {
	public GameController gc;

	//Button Highlight Vars
	public int selectedButton = 0;
	public Image highlight;

	void Start () {
		moveButtonHighlight ();
	}

	void Update () {

	}

	public void changeSelected(int s){
		selectedButton = s;
		moveButtonHighlight ();
	
	}

	void moveButtonHighlight(){

		switch (selectedButton) {
		case 0:
			highlight.rectTransform.anchoredPosition = new Vector3(60f,12.3f,0f);
			break;
		case 1:
			highlight.rectTransform.anchoredPosition = new Vector3(158f,12.3f,0f);
			break;
		}

	}

}
