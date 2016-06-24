

function readTextFile (file) {
  //file = "file://" + file;
  alert("1");
  var fileDisplayArea = document.getElementById('fileDisplayArea');
  var rawFile = new XMLHttpRequest();
  alert("2");
  rawFile.open("GET", file, false);
  alert("3");
  rawFile.onreadystatechange = function() {
    alert("4");
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var allText = rawFile.responseText;
        fileDisplayArea.innerText = allText;
        alert("5");
      }
    }
  }
  alert("6");
  rawFile.send(null);
}


//readTextFile("file///C:/Users/Vincent Tse/Desktop/iris_ac.txt");

function openPeer(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  
  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tabcontent.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  
  // Show the current tab, and add an "active" class to the link that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}



function readTextFile2 (filepath) {
  alert("1");
  var str = "";
  alert("1.5");
  var txtFile = new File(filepath);
  alert("2");
  txtFile.open("r");
  alert("3");
  while (!txtFile.eof) {
    str += txtFile.readln() + "\n";
  }
  alert("4");
  txtFile.close();
  alert(str);
  return str;
}



function readTextFile3 (file) {
  alert("1");
  var reader = new FileReader();
  alert("2");
  reader.onload = function(event) {
    alert("inside onload");
      var contents = event.target.result;
      console.log("File contents: " + contents);
  }
  
  reader.onerror = function(event) {
      console.error("File could not be read! Code " + event.target.error.code);
  }
  alert("3");
  alert(file);
  reader.readAsText(file); //!

  alert("4");
}