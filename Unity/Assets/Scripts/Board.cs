using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class Board : MonoBehaviour {

	//GUI Nonsense//
	public float boardSpacing;
	public int startLocation;
	public int endLocation;
	public float posStart;
	public float posEnd;
	public Text displayText;

	//Board State//
	public int myPosition;
	public int oppPosition;
	int boardSize;
	float realBoardRange;

	// Use this for initialization
	void Start () {
		boardSize = endLocation - startLocation;
		realBoardRange = posEnd - posStart;
		myPosition = startLocation;
		oppPosition = endLocation;
		boardSpacing = (realBoardRange / boardSize);
	}
	
	// Update is called once per frame
	void Update () {

	}

	//***Player Animation Commands***//

	public void changeBoardString(string str){
		displayText.text = str;
	}
	
	//***Other Animations***//

	public void deathAnimation(){
		displayText.text = "YOU LOSE";

	}
}


