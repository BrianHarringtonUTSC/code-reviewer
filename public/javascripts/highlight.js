var highlight_str = '';
var highlight_array = [];
function set_up_highlight(init_highlights) {
	highlight_array = [];
	var temp_highlight_array = [];
	var temp = [];
	temp_highlight_array = init_highlights.toString().split(",");
	for (var i = 1; i <= temp_highlight_array.length; i++) {
		temp.push(temp_highlight_array[i-1]);
		if (i % 3 == 0) {
			highlight_array.push(temp);
			temp = []
		}
	}

	for (var i = 0; i < highlight_array.length; i ++) {
		highlight(parseInt(highlight_array[i][0]), parseInt(highlight_array[i][1]), highlight_array[i][2]);
	}
	
	document.getElementById('storage').value = highlight_array;
}


function addCommentFromSelection() {
	var selection = window.getSelection();
	if (!selection || selection.isCollapsed) {
		window.alert('Please highlight the codes you want to comment!')
		return;
	}

	var anchorNode = selection.anchorNode;
	var focusNode = selection.focusNode;

	while (anchorNode.nodeName != 'LI') {
		if (anchorNode.parentNode != null) {
			anchorNode = anchorNode.parentNode;
		} else {
			window.alert('Please highlight the codes you want to comment!')
			return;
		}
	}

	while (focusNode.nodeName != 'LI') {
		if (focusNode.parentNode != null) {
			focusNode = focusNode.parentNode;
		} else {
			window.alert('Please highlight the codes you want to comment!')
			return;
		}
	}

	var startLine = parseInt(anchorNode.id.slice(5));
	var endLine = parseInt(focusNode.id.slice(5));

	if (startLine > endLine) {
		endLine = [startLine, startLine = endLine][0];
	}

	var comment = window.prompt('Please enter your comment:');

	if (comment) {
		store_comments(startLine, endLine, comment);		
		highlight(startLine, endLine, comment);

	}

	window.getSelection().removeAllRanges();
}

function store_comments(startLine, endLine, comment) {
	comment = comment.replace(new RegExp(',', 'g'), '♠');
	highlight_array.push([startLine, endLine, comment]);
	document.getElementById('storage').value = highlight_array;
	document.getElementById('comments').value = "";
	com.style.display = "none";
	sbtn.style.display = "none";
}

function highlight(startLine, endLine, comment) {
	comment = comment.replace(new RegExp('♠', 'g'), ',');
	for (var i = startLine; i <= endLine; i++) {
		nextElement = document.getElementById('line-' + String(i));
		if (nextElement.className === "highlight-1") {
			nextElement.className = "highlight-2";
		} else if (nextElement.className === "highlight-2") {
			nextElement.className = "highlight-3";
		} else if (nextElement.className === "highlight-3") {
			;
		} else {
			nextElement.className = "highlight-1";
		}
		nextElement.onmouseover = showPopup;
		//nextElement.addEventListener("mouseover", function(){showPopup(line);});
		nextElement.onmouseout = hidePopup;

		nextElement.setAttribute('comment', (nextElement.getAttribute('comment') ? nextElement.getAttribute('comment') : '') + comment + '<br>');
	};
}

function showPopup(e) {
	var x = e.clientX;
	var y = e.clientY;
	console.log(x, y);
	var element = document.getElementById('popup');
	element.style.display = 'block';
	element.style.top = String(y) + 'px';
	element.style.left = String(x) + 'px';
	var target = e.target;
	while (target && target.nodeName !== 'LI') {
		target = target.parentNode;
	}
	document.getElementById('popup').innerHTML = target.getAttribute('comment');
}

function hidePopup(e) {
	document.getElementById('popup').style.display = 'none';
}

function get_star(num) {
	document.getElementById('star_number').value = num;
}

function get_mark(num) {
	document.getElementById('mark_number').value = num;
}

//--------------------------------------------------------------------------------------

// Get the modal
var modal = document.getElementById('myModal');
var modal_del = document.getElementById('myModal_del');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");
var dbtn = document.getElementById("myBtn_del")
var sbtn = document.getElementById("saveBtn");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var span_del = document.getElementsByClassName("close")[1];

var com = document.getElementById("comments");

var anchorNode = null;
var focusNode = null;
// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
    var selection = window.getSelection();
    var error_message = 'Please highlight the codes you want to comment!';
	if (!selection || selection.isCollapsed) {
		document.getElementById('text_in_modal').innerHTML = error_message;
		return;
	}

	anchorNode = selection.anchorNode;
	focusNode = selection.focusNode;

	while (anchorNode.nodeName != 'LI') {
		if (anchorNode.parentNode != null) {
			anchorNode = anchorNode.parentNode;
		} else {
			document.getElementById('text_in_modal').innerHTML = error_message;
			return;
		}
	}

	while (focusNode.nodeName != 'LI') {
		if (focusNode.parentNode != null) {
			focusNode = focusNode.parentNode;
		} else {
			document.getElementById('text_in_modal').innerHTML = error_message;
			return;
		}
	}

	document.getElementById('text_in_modal').innerHTML = "Please enter comments.";
	com.style.display = "block";
	sbtn.style.display = "block";

	if (comment) {
		store_comments(startLine, endLine, comment);		
		highlight(startLine, endLine, comment);

	}

	window.getSelection().removeAllRanges();
}


sbtn.onclick = function() {
	modal.style.display = "none";
	var startLine = parseInt(anchorNode.id.slice(5));
	var endLine = parseInt(focusNode.id.slice(5));

	if (startLine > endLine) {
		endLine = [startLine, startLine = endLine][0];
	}
	var comment = document.getElementById('comments').value;

	if (comment) {
		store_comments(startLine, endLine, comment);		
		highlight(startLine, endLine, comment);
	}
}

dbtn.onclick = function() {
	modal_del.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
    modal_del.style.display = "none";
    com.style.display = "none";
	sbtn.style.display = "none";
    document.getElementById('comments').value = "";
}

// When the user clicks on <span> (x), close the modal
span_del.onclick = function() {
    modal_del.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        com.style.display = "none";
		sbtn.style.display = "none";
        document.getElementById('comments').value = "";
    }
    if (event.target == modal_del) {
    	modal_del.style.display = "none";
    }
}