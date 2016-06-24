function highlight() {
	var selection = window.getSelection();
	var anchorNode = selection.anchorNode;
	var focusNode = selection.focusNode;
	window.alert(anchorNode);
	window.alert(anchorNode);

	while (anchorNode.nodeName != "LI") {
		if (anchorNode.parentNode != null) {
			anchorNode = anchorNode.parentNode;
		} else {
			window.alert("Invalid selection!")
			return;
		}
	}

	while (focusNode.nodeName != "LI") {
		if (focusNode.parentNode != null) {
			focusNode = focusNode.parentNode;
		} else {
			window.alert("Invalid selection!")
			return;
		}
	}

	var startLine = parseInt(anchorNode.id.slice(5));
	var endLine = parseInt(focusNode.id.slice(5));

	if (startLine > endLine) {
		endLine = [startLine, startLine = endLine][0];
	}

	for (var i = startLine; i <= endLine; i++) {
		nextElement = document.getElementById("line-" + String(i));
		if (nextElement.className === "highlight-1") {
			nextElement.className = "highlight-2";
		} else if (nextElement.className === "highlight-2") {
			nextElement.className = "highlight-3";
		} else if (nextElement.className === "highlight-3") {
			;
		} else {
			nextElement.className = "highlight-1";
		}
	};

	document.body.deselectAll();
}