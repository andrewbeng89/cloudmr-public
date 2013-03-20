$(document).ready(function() {
    // Run files
    var editor = ace.edit("editor");
    setupEditor();

    call("http://cloud-mreduce.ap01.aws.af.cm/","callback=?");
    //-----------

    function setupEditor() {
        editor.setValue("function test(){ console.log('hello world!')}");
        editor.setTheme("ace/theme/idle_fingers");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setShowPrintMargin(false);
        editor.setHighlightActiveLine(true);
        editor.resize();
        editor.setBehavioursEnabled(true);
        editor.getSession().setUseWrapMode(true);
        document.getElementById('editor').style.fontSize='12px';
    }

    $("#run").click(function() {
        console.log('run');
    });
    $("#reset").click(function() {
        editor.setValue("");
        console.log('reset');
    });

    function call(url, param){;
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
        });
    }


    // Load the question, the preloaded code, and the appropriate hint
    function loadQuestions(){
        var url = ""; //this is the url to call
        var param = "callback=?"; //add the related parameters

        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var question = data.question;
            var hint = data.hint;
            var code = data.code;

            $('#question').append(question);
            $('#hint').append(hint);
            setupEditor();
            editor.setValue(code);

        });
    }

















});
