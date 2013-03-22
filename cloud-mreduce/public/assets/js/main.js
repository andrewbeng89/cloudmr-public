$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var questionsEndpoint = "http://cloud-mreduce.ap01.aws.af.cm/questions";
    var totalQuestionsEndpoint = "http://cloud-mreduce.ap01.aws.af.cm/total_questions";
    var verifyEndpoint = "http://cloud-mreduce.ap01.aws.af.cm/verify";
    var question_id = "";
    var currentLang = "js";
    var js_code = "";
    var py_code = "";
    var editor = ace.edit("editor");

    // ----------------------------- Setup files -----------------------------
    setupEditor();
    loadQuestions();


    function setupEditor() {
        // editor.setValue("function test(){ console.log('hello world!')}");
        editor.setTheme("ace/theme/eclipse");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setShowPrintMargin(false);
        editor.setHighlightActiveLine(true);
        editor.resize();
        editor.setBehavioursEnabled(true);
        editor.getSession().setUseWrapMode(true);
        document.getElementById('editor').style.fontSize = '14px';
    }


    // ----------------------------- Click Listeners -----------------------------

    $("#run").click(function() {
        run();
    });
    $("#reset").click(function() {
        var c = "";
        if (currentLang == "py") {
            c = py_code;
        } else {
            c = js_code;
        }
        editor.setValue(c);
        $('#console').text("");  
    });

    // Toggle the tabs
    $("#langJS").click(function() {
        $(this).toggleClass("active");
        $("#langPY").toggleClass("active");
        editor.setValue(js_code);
        setupEditor();
        currentLang = "js";
    });
    $("#langPY").click(function() {
        $(this).toggleClass("active");
        $("#langJS").toggleClass("active");
        editor.setValue(py_code);
        setupEditor();
        currentLang = "py";
    });

    // ----------------------------- Methods -----------------------------

    // Load the question, the preloaded code, and the appropriate hint

    function loadQuestions() {
        var questionId = GetURLParameter('id');
        var url = questionsEndpoint; //this is the url to call
        var param = "callback=?" + "&id=" + questionId; //add the related parameters

        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            question_id = data.question_id;
            var question = data.question;
            var hint = data.hint;
            var title = data.title;
            js_code = data.js_code;
            py_code = data.py_code;
            $('#question').empty().append("<h4><b>" + title + "</b></h4>" + question);
            $('#hint').append(hint);
            editor.setValue(js_code);
            setupEditor();
            var nextq = question_id + 1;
            // $('#nextClass').removeAttr('id');
            $('#nextClass').attr("href", top.location.href.substring(0, top.location.href.indexOf('?')) + "?id=" + nextq);
        });
        totalQuestions();
    }

    function totalQuestions() {

        var url = totalQuestionsEndpoint; //this is the url to call
        var param = "callback=?";
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            if (question_id >= data.number) {
                $('#nextClass').attr("disabled", "disabled");
            }
        });
    }

    function run() {
        var url = verifyEndpoint; //this is the url to call
        var code = editor.getValue();   
        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + currentLang + "&q_id=" + question_id + "&solution=" + code; //lang, q_id, solution
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var error = data.errors;
            if (error == null) {
                var call = data.results[0].call; //array
                var correct = data.results[0].correct; //array
                var solved = data.solved; //boolean
                $('#console').append("Call: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                $('#console').scrollTop($('#console')[0].scrollHeight);
            } else {
                if (error != null) {
                    alert(error);
                }
            }

        });
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
