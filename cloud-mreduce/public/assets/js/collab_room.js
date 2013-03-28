$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var editorMapper = ace.edit("editorMapper");
    var editorReducer = ace.edit("editorReducer");
    var roomCount = 0;
    var lobbyendpoint = "http://localhost:3000/";
    var server = io.connect(lobbyendpoint);
    var roomId = GetURLParameter('room');
    var lang = GetURLParameter('lang');
    var pos = GetURLParameter('pos');
    var room = {};
    var position = ''; //this is the current position
    room.roomId = roomId;
    var username = $.now();
    // ----------------------------- Setup files -----------------------------
    setupEditor();
    checkRoomFull();
    enterRoom();
    realtime();

    function setupEditor() {

        editorMapper.setTheme("ace/theme/eclipse");
        editorMapper.setShowPrintMargin(false);
        editorMapper.setHighlightActiveLine(true);
        editorMapper.resize();
        editorMapper.setBehavioursEnabled(true);
        editorMapper.getSession().setUseWrapMode(true);
        document.getElementById('editorMapper').style.fontSize = '14px';

        editorReducer.setTheme("ace/theme/eclipse");
        editorReducer.setShowPrintMargin(false);
        editorReducer.setHighlightActiveLine(true);
        editorReducer.resize();
        editorReducer.setBehavioursEnabled(true);
        editorReducer.getSession().setUseWrapMode(true);
        document.getElementById('editorReducer').style.fontSize = '14px';

        if (lang === "javascript") {
            editorMapper.getSession().setMode("ace/mode/javascript");
            editorReducer.getSession().setMode("ace/mode/javascript");
        } else if (lang === "python") {
            editorMapper.getSession().setMode("ace/mode/python");
            editorReducer.getSession().setMode("ace/mode/python");
        }

        if (pos === 'reducer') {
            editorMapper.setReadOnly(true);
            editorReducer.setReadOnly(false);
        } else if (pos === 'mapper') {
            editorMapper.setReadOnly(false);
            editorReducer.setReadOnly(true);
        }
    }


    // ----------------------------- Click Listeners -----------------------------



    // ----------------------------- Methods -----------------------------

    //Socket coding realtime

    function realtime() {
        //Change Listen

        // var range = new Range(1, 1, 10, 10);
        // var markerMapper = editorMapper.getSession().addMarker(range, "ace_selected_word", "text");
        // var markerReducer = editorReducer.getSession().addMarker(range, "ace_selected_word", "text");



        var stateMapper = true;
        var stateReducer = true;
        console.log('codeChange' + roomId + position);
        server.on('codeChange' + roomId + position, function(code) {
            if (position === 'reducer') {
                editorMapper.setValue(code);
                editorMapper.getSession().getSelection().selectionLead.setPosition(1,1);
                // editorMapper.getSession.removeMarker(markerMapper);
            } else if (position === 'mapper') {
                editorReducer.setValue(code);
                editorReducer.getSession().getSelection().selectionLead.setPosition(1,1);
                // editorReducer.getSession.removeMarker(markerReducer);
            }
        });

        //Code change
        editorMapper.getSession().on('change', function(e) {
            if (stateMapper == true) {
                stateMapper = false;
            } else {
                stateMapper = true;
            }

            if (stateMapper == false) {
                var code = editorMapper.getValue();
                // console.log(code);
                server.emit('codeChangeMapper', room, code);
            }
        });

        editorReducer.getSession().on('change', function(e) {

            if (stateReducer == true) {
                stateReducer = false;
            } else {
                stateReducer = true;
            }

            if (stateReducer == false) {
                var code = editorReducer.getValue();
                // console.log(code);
                server.emit('codeChangeReducer', room, code);
            }
        });
    }

    function checkRoomFull() {
        server.on('enterRoom' + roomId, function(room) {
            roomCount++;
            // when both players have entered the room
            takeSide();
            if (roomCount == 2) {
                room.roomCount = roomCount;
                room.pos = pos;
                server.emit('closeRoom', room);
                server.emit('takeSide', room);
                position = pos;
                takeSide();
                realtime();
            }

            console.log(roomCount);
        });
    }

    function takeSide() {
        console.log('setSide' + roomId + position);
        server.on('setSide' + roomId + position, function(room) {
            if (position === 'reducer') {
                editorMapper.setReadOnly(true);
                editorReducer.setReadOnly(false);
            } else if (position === 'mapper') {
                editorMapper.setReadOnly(false);
                editorReducer.setReadOnly(true);
            }
        });
    }

    function enterRoom() {
        console.log('Enter Room');
        room.member = username;
        server.emit('connectRoom', room);
        if (pos === 'reducer') {
            position = 'mapper';
        } else if (pos === 'mapper') {
            position = 'reducer';
        }
    }

    // ----------------------------- Utility -----------------------------

    function GetURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    function updateURLParameter(url, param, paramVal) {
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            tempArray = additionalURL.split("&");
            for (i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != param) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }

        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }


});
// Prevent accidental backspace press out of the editor text areas
$(document).keydown(function(e) {
    var element = e.target.nodeName.toLowerCase();
    if ((element != 'editorMapper') || (element != 'editorReducer')) {
        if (e.keyCode === 8) {
            return false;
        }
    }
});
