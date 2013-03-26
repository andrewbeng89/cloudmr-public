$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var lobbyendpoint = "http://localhost:3000/";
    var server = io.connect(lobbyendpoint);
    // ----------------------------- Setup files -----------------------------
    connect();
    loadUser();
    removeUser();


    // ----------------------------- Click Listeners -----------------------------

    $("#create").click(function() {
        var form = $('#createroomForm');
        var lang = $('.control-group input[name=languageoptions]:checked').val();
        var pos = $('.control-group input[name=positionoptions]:checked').val();
        var username = "kenneth"

        //Insert ajax request here
        //On success create an entry in the table
        if (pos == "mapper") {
            $('#lobby tr:last').after("<tr><td>" + username + "</td><td></td><td>" + lang + "</td><td><a href='collaborate.html'><button class='btn btn-success'>Join</button></a></td></tr>");

        } else if (pos == "reducer") {
            $('#lobby tr:last').after("<tr><td></td><td>" + username + "</td><td>" + lang + "</td><td><a href='collaborate.html'><button class='btn btn-success'>Join</button></a></td></tr>");
        }

    });

    // ----------------------------- Methods -----------------------------



    function loadUser() {
        server.on('connect', function(data) {
            if (data != null) {
                $('#onlineUsers tr:last').after('<tr id='+data+'><td>' + data + '</td></tr>');
            }
        });
    }

    function loadtables() {

        server.on('create', function(lobby) {
            createRoom();
        });
    }

    function createRoom() {

    }

    function connect() {
        var username = $.now();
        server.emit('connect', username);

    }

    function removeUser() {
        server.on('removeUser', function(name) {
            $('#'+name).remove();
        });
    }


    // ----------------------------- Utility -----------------------------

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
