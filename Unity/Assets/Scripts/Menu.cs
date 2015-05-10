using UnityEngine;
using System.Collections;

public class Menu : MonoBehaviour {

	public GameObject[] pages;
	public int currentPage = 0;
	public MenuController mc;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	public void openMenu(int onPage){
		turnPage (onPage);
		this.gameObject.SetActive (true);
	}

	public void closeMenu(){
		this.gameObject.SetActive (false);
	}

	public void turnPage(int toPage){
		pages [currentPage].gameObject.SetActive (false);
		pages [toPage].gameObject.SetActive (true);
		currentPage = toPage;
	}


}
