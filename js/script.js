//import { $ } from "./lib/sarQuery/sarQuery.js";
/**
 * @type {Array<FuzzyVariable>}
 */
let fuzzyVariables;
let resultGraph;
let fuzzyReasonVariable;
const colorList = [
    "#03A9F4",
    "#FFC107",
    "#F44336",
    "#4CAF50",
    "#673AB7",
    "#00BCD4",
    "#E91E63"
];
window.addEventListener("load", function (e)
{
    init();
});
function init()
{
    fuzzyVariables = new ArrayList();
    window.fuzzyVariables = fuzzyVariables;
    HTMLTemplate.Init();
    initFuzzyVarPage(); 
    initFuzzyReasonPage();
    $(".page").removeClass("visible");
    $("#page-fuzzy-variable").addClass("visible");
}
function initFuzzyVarPage()
{
    let fuzzyVariableTemplate = $("#fuzzy-variable-template")[0].template;
    let fuzzyVariableWrapper = $("#fuzzy-variable-wrapper")[0];
    fuzzyVariables.add(new FuzzyVariable("FuzzyVariable", 0, 100));
    let templateItem = fuzzyVariableTemplate.render(fuzzyVariables[0])[0];
    templateItem.insertInto(fuzzyVariableWrapper);
    initFuzzyVarView(fuzzyVariables[0], templateItem.firstElement);
    $("#button-fuzzy-var-add").click(function (e)
    {
        let fuzzyVar = new FuzzyVariable("FuzzyVariable", 0, 100);
        fuzzyVariables.add(fuzzyVar);
        let templateItem = fuzzyVariableTemplate.render(fuzzyVar)[0];
        templateItem.insertInto(fuzzyVariableWrapper);
        initFuzzyVarView(fuzzyVar, templateItem.firstElement);
    });
    $("#tab-fuzzy-var").click(function (e)
    {
        $(".tab").removeClass("viewing");
        $("#tab-fuzzy-var").addClass("viewing");
        $(".page").removeClass("visible");
        $("#page-fuzzy-variable").addClass("visible");
    });
    $("#tab-fuzzy-reason").click(function (e)
    {
        $(".tab").removeClass("viewing");
        $("#tab-fuzzy-reason").addClass("viewing");
        $(".page").removeClass("visible");
        $("#page-fuzzy-reason").addClass("visible");
    });
}
function initFuzzyReasonPage()
{
    let fuzzyVariableTemplate = $("#fuzzy-variable-template")[0].template;
    fuzzyReasonVariable = new FuzzyVariable("Result", 0, 100);
    let element = fuzzyVariableTemplate .render(fuzzyReasonVariable)[0].firstElement;
    $("#page-fuzzy-reason")[0].insertBefore(element, $("#fuzzy-reason-rule")[0]);
    initFuzzyVarView(fuzzyReasonVariable, element, false);
    resultGraph = new Graph($("#fuzzy-reason-graph")[0], fuzzyReasonVariable.range);
    resultGraph.controlable = false;
    $("#fuzzy-reason-rules").blur(function (e)
    {
        renderFuzzyRuleResult();
    });
}
/**
 * 
 * @param {FuzzyVariable} fuzzyVar 
 * @param {Element} element 
 */
function initFuzzyVarView(fuzzyVar, element, initValueBar = true)
{
    fuzzyVar.element = element;
    fuzzyVar.graph = new Graph($(element, ".graph")[0], fuzzyVar.range);
    fuzzyVar.graph.onMouseMove = function (x)
    {
        for (let i = 0; i < fuzzyVar.fuzzySets.length; i++)
        {
            let value = fuzzyVar.fuzzySets[i].fuzzify(x);
            $(fuzzyVar.fuzzySets[i].element, ".fuzzy-set-value").text(value);
        }
    }

    let buttonAddFuzzSet = $(element, ".fuzzy-set-add");

    buttonAddFuzzSet.click(function (e)
    {
        let fuzzySet = new FuzzySet("FuzzySet", fuzzyVar.range.from, fuzzyVar.range.to);
        fuzzySet.color = new Color(colorList[fuzzyVar.fuzzySets.length]);
        fuzzyVar.addFuzzySet(fuzzySet);
        initFuzzySet(fuzzyVar, fuzzySet);
    });

    $(element, ".fuzzy-var-map-to-unit > input")[0].addEventListener("change",function (e)
    {
        let check = $(element, ".fuzzy-var-map-to-unit > input")[0].checked;
        if (check)
        {
            fuzzyVar.mapToUnit = true;
        }
        else {
            fuzzyVar.mapToUnit = false;
        }
    });

    $(element, ".fuzzy-var-name").blur(function (e)
    {
        fuzzyVar.name = $(element, ".fuzzy-var-name").text();
        fuzzyVariables[fuzzySet.name] = fuzzyVar;
    });
    $(element, ".fuzzy-var-ramge-from").blur(function (e)
    {
        let from = parseInt( $(element, ".fuzzy-var-ramge-from")[0].value);
        fuzzyVar.resetRange(from, fuzzyVar.range.to);
        fuzzyVar.graph.range.from = from;
        for (let i = 0; i < fuzzyVar.fuzzySets.length; i++)
        {
            $(fuzzyVar.fuzzySets[i].element, ".fuzzy-set-from").text(fuzzyVar.fuzzySets[i].range.from);
            $(fuzzyVar.fuzzySets[i].element, ".fuzzy-set-to").text(fuzzyVar.fuzzySets[i].range.to);
        }
    });
    $(element, ".fuzzy-var-ramge-to").blur(function (e)
    {
        let to = parseInt($(element, ".fuzzy-var-ramge-to")[0].value);
        fuzzyVar.resetRange(fuzzyVar.range.from, to);
        fuzzyVar.graph.range.to = to;
        for (let i = 0; i < fuzzyVar.fuzzySets.length; i++)
        {
            $(fuzzyVar.fuzzySets[i].element, ".fuzzy-set-from").text(fuzzyVar.fuzzySets[i].range.from);
            $(fuzzyVar.fuzzySets[i].element, ".fuzzy-set-to").text(fuzzyVar.fuzzySets[i].range.to);
        }
    });

    let fuzzySet = new FuzzySet("FuzzySet", fuzzyVar.range.from, fuzzyVar.range.to);
    fuzzyVar.addFuzzySet(fuzzySet);
    initFuzzySet(fuzzyVar, fuzzySet);
    if (!initValueBar)
        return;

    let fuzzyVarValueTemplate = $("#fuzzy-var-value-template")[0].template;
    let elementVarValue = fuzzyVarValueTemplate.render(fuzzyVar)[0].firstElement;
    $("#fuzzy-var-value-wrapper")[0].insertBefore(elementVarValue, null);
    let mousehold = false;
    let value = 0;
    $(element, ".fuzzy-var-name").blur(function (e)
    {
        let name = $(element, ".fuzzy-var-name").text();
        $(elementVarValue, ".fuzzy-var-value-name > .name").text(name);
    });
    $(elementVarValue,".fuzzy-var-value-bar .button")[0].addEventListener("mousedown", function (e)
    {
        mousehold = true;
    });
    window.addEventListener("mousemove", function (e)
    {
        if (!mousehold)
            return;
        let bound = $(elementVarValue, ".fuzzy-var-value-bar .wrapper")[0].getBoundingClientRect();
        let x = e.clientX - bound.left;
        x = x < 0 ? 0 : x;
        x = x > bound.width ? bound.width : x;
        value = x / bound.width * fuzzyVar.range.length + fuzzyVar.range.from;
        fuzzyVar.value = value;
        $(elementVarValue, ".fuzzy-var-value-bar .button").css("left", x + "px");
        renderFuzzyRuleResult();
    });
    window.addEventListener("mouseup", function (e)
    {
        mousehold = false;
    });
    
}
/**
 * 
 * @param {String} ruleText
 * @param {Array<FuzzyValue>} fuzzyValues
 * @returns {FuzzySetValue}
 */
function analyseFuzzyRule(ruleText, fuzzyValues)
{
    let valueSet = {};
    for (let i = 0; i < fuzzyValues.length; i++)
    {
        valueSet[fuzzyValues[i].name] = fuzzyValues[i];
    }

    // Get result name
    ruleText = ruleText.replace(/\s/g, "");
    let reg = /(.+)(=)(.+)/;
    let match = reg.exec(ruleText);
    if (!match || match.length < 4)
    {
        throw new Error("Syntax error.");
    }
    let resultName = match[1].toString();
    
    // Get first value
    reg = /([a-zA-Z0-9_$.()]+)(.*)/g;
    match = reg.exec(match[3]);
    if (!match || match.length < 3)
        throw new Error("Syntax error.");
    let lValue = getValue(match[1]);
    let rest = match[2];

    // Calculate rest
    reg = /([&|])([a-zA-Z0-9_$.()]+)(.*)/g;
    for (let match = reg.exec(rest); match && match.length >= 4; (rest = match[3]), (match = reg.exec(rest)))
    {
        let op = match[1];
        let rValue = getValue(match[2]);
        switch (op)
        {
            case "&":
                lValue = Math.min(lValue, rValue);
                break;
            case "|":
                lValue = Math.max(lValue, rValue);
                break;
        }
    }
    return new FuzzySetValue(resultName, lValue);
    function getValue(name)
    {
        let modifyReg = /([a-zA-z0-9_]+)\(([a-zA-Z0-9_$.()]+)\)/g;
        let match = modifyReg.exec(name);
        let modify = normal;
        if (match && match.length >= 3)
        {
            let modifierStr = match[1].toLowerCase();
            switch (modifierStr)
            {
                case "normal":
                    modify = normal;
                    break;
                case "very":
                    modify = very;
                    break;
                case "fairly":
                    modify = fairly;
                    break;
                default:
                    throw new Error("Unknown modifier.");
            }
            name = match[2];
        }
        try
        {
            return modify(eval("valueSet." + name));
        }
        catch (error)
        {
            throw new Error("Cannot get value of " + name);
        }
        function normal(x) { return x; }
        function very(x) { return Math.pow(x, 2); }
        function fairly(x) { return Math.pow(x, 0.5); }
    }
}
/**
 * 
 * @param {String} code 
 * @param {Array<FuzzyValue>} fuzzyValues
 * @returns {FuzzyValue}
 */
function executeFuzzyCode(code, fuzzyValues)
{
    let rules = code.replace(/\r\n/g, "\n").split("\n");
    /**
     * @type {Array<FuzzySetValue>}
     */
    let resultSet = new ArrayList();
    let evalCodeReg = /\$(.+)/;
    let ResultHandle = RepeatHandle.Max;

    for (let i = 0; i < rules.length; i++)
    {
        try
        {
            if (rules[i].replace(/\s/g, "") == "")
                continue;
            if (evalCodeReg.test(rules[i]))
            {
                const Max = RepeatHandle.Max;
                const Min = RepeatHandle.Min;
                const Sum = RepeatHandle.LimitSum;
                const Avg = RepeatHandle.Avg;
                let evalCode = evalCodeReg.exec(rules[i])[1].toString();
                eval(evalCode);
                continue;
            }
            resultSet.add(analyseFuzzyRule(rules[i], fuzzyValues));
        }
        catch (error)
        {
            alert("At line " + i + 1 + " :" + error.message);
        }
    }
    let nameList = new ArrayList();
    let resultList = new ArrayList();
    for (let i = 0; i < resultSet.length; i++)
    {
        let name = resultSet[i].name;
        let value = resultSet[i].value;
        if (nameList.indexOf(name) >= 0)
            continue;    
        for (let j = i + 1; j < resultSet.length; j++)
        {
            if (resultSet[j].name == name)
            {
                switch (ResultHandle)
                {
                    case RepeatHandle.LimitSum:
                        value += resultSet[j].value;
                        value = value > 1 ? 1 : value;
                        break;
                    case RepeatHandle.Max:
                        value = Math.max(value, resultSet[j].value);
                        break;
                    case RepeatHandle.Min:
                        value = Math.min(value, resultSet[j].value);
                }
            }
        }
        nameList.add(name);
        resultList.add(new FuzzySetValue(name, value));
    }
    return new FuzzyValue("Result", resultList);
}
/**
 * @returns {FuzzyValue}
 */
function renderFuzzyRuleResult()
{
    let code = $("#fuzzy-reason-rules").text();
    let valueSet = new ArrayList();
    for (let i = 0; i < fuzzyVariables.length; i++)
    {
        valueSet.add(fuzzyVariables[i].fuzzify(fuzzyVariables[i].value));
    }
    let resultSet = executeFuzzyCode(code, valueSet);
    resultGraph.funcList.clear();
    let resultFuzzyVar = FuzzyVariable.deserialize(fuzzyReasonVariable.serialize());
    for (let i = 0; i < resultSet.values.length; i++)
    {
        let func = fuzzyReasonVariable.fuzzySets[resultSet.values[i].name].fuzzyFunction.copy();
        resultFuzzyVar.fuzzySets[i].fuzzyFunction = func;
        resultGraph.addFunction(func, fuzzyReasonVariable.fuzzySets[resultSet.values[i].name].color);
        func.cut(resultSet.values[i].value);
    }

    resultGraph.ClearVerLine();
    if ($("#defuzzify-mom input")[0].checked){
        resultGraph.addVerLine(resultFuzzyVar.defuzzify(DefuzzifyMethod.MOM), new Color(255, 0, 0, 0.3));
    }
    if ($("#defuzzify-centroid input")[0].checked)
    {
        resultGraph.addVerLine(resultFuzzyVar.defuzzify(DefuzzifyMethod.Centroid, { sample: 30 }), new Color(0, 255, 0, 0.3));
    }
    if ($("#defuzzify-maxavg input")[0].checked)
    {
        resultGraph.addVerLine(resultFuzzyVar.defuzzify(DefuzzifyMethod.MaxAvg), new Color(0, 0, 255, 0.3));
    }
}


/**
 * @typedef RepeatHandle
 * @enum 
 */
const RepeatHandle = {
    LimitSum: Symbol("limit sum"),
    Min: Symbol("min"),
    Max: Symbol("max"),
    Avg: Symbol("average")
};
/**
 * 
 * @param {FuzzyVariable} fuzzyVar 
 * @param {FuzzySet} fuzzySet 
 */
function initFuzzySet(fuzzyVar, fuzzySet)
{
    let fuzzSetTemplate = $(fuzzyVar.element, ".fuzz-set-template ")[0].template;
    let buttonAddFuzzSet = $(fuzzyVar.element, ".fuzzy-set-add");
    let color = fuzzySet.color.copy();
    fuzzySet.color.alpha = 0.3;
    let templateItem = fuzzSetTemplate.render(fuzzySet)[0];
    fuzzySet.color = color;
    templateItem.insertBefore(buttonAddFuzzSet[0]);
    fuzzySet.element = templateItem.firstElement;

    fuzzyVar.graph.addFunction(fuzzySet.fuzzyFunction, fuzzySet.color);

    $(fuzzySet.element, ".fuzzy-set-name").blur(function (e)
    {
        fuzzySet.name = $(fuzzySet.element, ".fuzzy-set-name").text();
        fuzzyVar.fuzzySets[fuzzySet.name] = fuzzySet;
    });
}
function initAxis(scene, Width, Height)
{
    var lineY = new Line(new Point(0, 0), new Point(0, Height));
    lineY.strokeStyle = new Color(0, 0, 0, 0.2);
    lineY.strokeWidth = 3;
    scene.addGameObject(lineY.toGameObject());

    var lineX = new Line(new Point(0, 0), new Point(Width, 0));
    lineX.strokeStyle = new Color(0, 0, 0, 0.2);
    lineX.strokeWidth = 3;
    scene.addGameObject(lineX.toGameObject());

    /*var axis = new Path();
    axis.addPoint(0, Height);
    axis.addPoint(0, 0);
    axis.addPoint(Width, 0);*/

}
class FuzzyValue
{
    /**
     *
     * @param {String} name
     * @param {Array<FuzzySetValue>} fuzzySetValues 
     */
    constructor(name, fuzzySetValues)
    {
        this.name = name;
        /**
         * @type {Array<FuzzySetValue>}
         */
        this.values = fuzzySetValues;
        for (let i = 0; i < fuzzySetValues.length; i++)
        {
            this[fuzzySetValues[i].name] = fuzzySetValues[i].value;
        }
    }
}
class FuzzySetValue
{
    /**
     * 
     * @param {String} name 
     * @param {Number} value 
     */
    constructor(name, value)
    {
        this.name = name;
        this.value = value;
    }
}
window.control = false;
class Graph
{
    /**
     * 
     * @param {Scene} scene 
     * @param {Range} range
     */
    constructor(outputElement, range)
    {
        let engine = SarEngine.createInNode(outputElement);
        let scene = engine.scene;
        let camera = scene.cameraList[0];
        let display = camera.displayList[0];
        let input = display.getInput();
        let Width = display.renderWidth;
        let Height = display.renderHeight;
        scene.addInput(input);
        $(outputElement).css("flex", "none");
        engine.start();
        scene.worldBackground = new Color(0, 0, 0, 0);
        camera.moveTo(Width / 2 - 15, Height / 2 - 15);
        Width -= 30;
        Height -= 30;
        initAxis(scene, Width, Height);

        this.outputElement = outputElement;
        this.engine = engine;
        this.scene = scene;
        this.display = display;
        this.camera = camera;
        this.width = Width;
        this.height = Height;
        this.onMouseMove = null;
        this.onClick = null;
        this.range = range;
        this.sample = 500;
        this.controlable = true;
        this.mousePos = { x: -1000, y: -1000 };
        /**
         * @type {Array<FuzzyFunction>}
         */
        this.funcList = new ArrayList();
        this.renderLines = new Combination();
        let graphObj = new GameObject();
        let graphGraphics = new Combination();
        graphObj.graphic = graphGraphics;
        scene.addGameObject(graphObj);
        const graph = this;
        scene.onUpdate = function (e)
        {
            graphGraphics.objectList.clear();
            for (let i = 0; i < graph.funcList.length; i++)
            {
                let comb = new Combination();
                graphGraphics.addObject(comb);
                let func = graph.funcList[i];
                let color = func.color;
                let fillColor = color.copy();
                fillColor.alpha = 0.2;
                let path = new Path();
                let pathFill = new Path();
                if (func.fuzzyVar && func.fuzzyVar.mapToUnit)
                {
                    for (let i = 0; i <= graph.sample; i++)
                    {
                        let x = i / graph.sample * graph.range.length + graph.range.from;

                        let y = func.calculate(x);
                        /*
                        let sum = 0;
                        for (let j = 0; j < graph.funcList.length; j++)
                        {
                            sum += graph.funcList[j].calculate(x);
                        }
                        if (sum != 0)
                        {
                            y = func.calculate(x) / sum;
                        }*/
                        x = (x - graph.range.from) * graph.width / graph.range.length;
                        y = y * graph.height;
                        path.addPoint(x, y);
                        if (i == 0)
                            pathFill.addPoint(x, 0);
                        pathFill.addPoint(x, y);
                        if (i == graph.sample)
                            pathFill.addPoint(x, 0);

                    }
                }
                else
                {
                    for (let i = 0; i < func.points.length; i++)
                    {
                        let point = func.points[i];
                        let x = (point.x - graph.range.from) / graph.range.length * graph.width;
                        let y = point.y * graph.height;
                        path.addPoint(x, y);
                        if (i == 0)
                            pathFill.addPoint(x, 0);
                        pathFill.addPoint(x, y);
                        if (i == func.points.length - 1)
                            pathFill.addPoint(x, 0);
                    }
                }
                pathFill.close();
                pathFill.strokeStyle = "transparent";
                pathFill.fillStyle = fillColor;
                comb.addObject(pathFill);

                path.strokeWidth = 1;
                path.strokeStyle = color;
                path.fillStyle = "transparent";
                comb.addObject(path);


                let x = graph.mousePos.x;
                let y = func.calculate(x * graph.range.length / graph.width + graph.range.from) * graph.height;
                let circle = new Circle(5);
                circle.strokeStyle = "#03A9F4";
                circle.fillStyle = "#03A9F4";
                circle.moveTo(x, y);
                comb.addObject(circle);
            }

            // Draw vertical lines
            graphGraphics.addObject(graph.renderLines);
        }
        this.initInput();
    }

    /**
     * 
     * @param {Number} x
     * @param {Color | String} color
     */
    addVerLine(x, color)
    {
        let maxY = -1;
        for (let i = 0; i < this.funcList.length; i++)
        {
            let y = this.funcList[i].calculate(x);
            if (maxY < y)
                maxY = y;
        }
        x = (x - this.range.from) / this.range.length * this.width;
        let line = new Line(new Point(x, 0), new Point(x, maxY * this.height));
        line.strokeStyle = color;
        line.strokeWidth = 2;
        this.renderLines.addObject(line);
    }
    ClearVerLine()
    {
        this.renderLines.clearObject();
    }

    /**
     * 
     * @param {FuzzyFunction} func
     * @param {Color} color
     */
    addFunction(func, color)
    {
        this.funcList.add(func);
        func.color = color;
    }

    initInput()
    {
        const graph = this;
        let mouseOnline = false;
        let pointEditing = null;
        document.onselectstart = function ()
        {
            if (window.control)
                return false;
        }
        this.scene.onMouseMove = function (e)
        {
            if (!graph.controlable)
                return;    
            let x = e.x;
            let y = e.y;
            x = x < 0 ? 0 : x;
            x = x > graph.width ? graph.width : x;
            y = y < 0 ? 0 : y;
            y = y > graph.height ? graph.height : y;
            graph.mousePos = { x: x, y: e.y };
            mouseOnline = false;

            graph.ClearVerLine();
            graph.addVerLine(x * graph.range.length / graph.width + graph.range.from, new Color(0, 0, 0, 0.2));
            if (graph.onMouseMove)
            {
                graph.onMouseMove(x * graph.range.length / graph.width + graph.range.from);
            }
            if (pointEditing)
            {
                pointEditing.x = x * graph.range.length / graph.width + graph.range.from;
                pointEditing.y = y / graph.height;
                return;
            }

            for (let i = 0; i < graph.funcList.length; i++)
            {
                let y = graph.funcList[i].calculate(x * graph.range.length / graph.width + graph.range.from) * graph.height;
                if (Math.abs(e.y - y) < 10)
                {
                    mouseOnline = true;
                }
            }
            if (mouseOnline)
            {
                $(graph.outputElement).css("cursor", "pointer");
            }
            else
            {
                $(graph.outputElement).css("cursor", "default");
            }
        }
        this.scene.onMouseDown = function (e)
        {
            window.control = true;
            if (!graph.controlable)
                return;
            let x = e.x;
            x = x < 0 ? 0 : x;
            x = x > graph.width ? graph.width : x;
            if (!mouseOnline)
                return;
            let min = Number.MAX_VALUE;
            let hoverFunc = null;
            for (let i = 0; i < graph.funcList.length; i++)
            {
                let y = graph.funcList[i].calculate(x * graph.range.length / graph.width + graph.range.from) * graph.height;
                if (Math.abs(y - e.y) < min)
                {
                    min = Math.abs(y - e.y);
                    hoverFunc = graph.funcList[i];
                }
            }
            for (let i = 0; i < hoverFunc.points.length; i++)
            {
                if (Math.abs(x - (hoverFunc.points[i].x -graph.range.from) * graph.width / graph.range.length) < 20)
                {
                    pointEditing = hoverFunc.points[i];
                    break;
                }
            }
            if (! pointEditing)
            {
                x = x * graph.range.length / graph.width + graph.range.from;
                let y = hoverFunc.calculate(x);
                pointEditing = hoverFunc.addPoint(x, y);
            }
        }
        window.addEventListener("mouseup", function (e)
        {
            pointEditing = null;
            window.control = false;
        });
    }
}
class FuzzyVariable
{
    /**
     * 
     * @param {String} name
     * @param {Number} from 
     * @param {Number} to 
     */
    constructor(name, from, to)
    {
        this.name = name;
        this.range = new Range(from, to);
        /**
         * @type {Array<FuzzySet>}
         */
        this.fuzzySets = new ArrayList();
        this.element = null;
        this.mapToUnit = false;
        this.value = 0;
        /**
         * @type {Graph}
         */
        this.graph = null;
    }
    /**
     * 
     * @param {FuzzySet} fuzzySet 
     */
    addFuzzySet(fuzzySet)
    {
        this.fuzzySets.add(fuzzySet);
        fuzzySet.fuzzyVar = this;
    }
    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     */
    resetRange(x, y)
    {
        for (let i = 0; i < this.fuzzySets.length; i++)
        {
            this.fuzzySets[i].resetRange(x, y);
        }
        return this.range = new Range(x, y);
    }
    /**
     * @param {Number} x
     */
    fuzzify(x)
    {
        let sum = 0;
        let resultList = new ArrayList();
        for (let i = 0; i < this.fuzzySets.length; i++)
        {
            resultList.add(new FuzzySetValue(this.fuzzySets[i].name, this.fuzzySets[i].fuzzify(x)));
        }    
        return new FuzzyValue(this.name, resultList);
    }
    /**
     * 
     * @param {DefuzzifyMethod} method
     * @param {Object} [options]
     * @returns {Number}
     */
    defuzzify(method, options)
    {
        if (method == DefuzzifyMethod.MOM)
        {
            let max = -1;
            let maxPoints = new ArrayList();
            for (let i = 0; i < this.fuzzySets.length; i++)
            {
                for (let j = 0; j < this.fuzzySets[i].fuzzyFunction.points.length; j++)
                {
                    let point = this.fuzzySets[i].fuzzyFunction.points[j];
                    if (point.y > max)
                    {
                        max = point.y;
                        maxPoints.clear();
                        maxPoints.add(point);
                    }
                    else if (point.y == max)
                    {
                        maxPoints.add(point);
                    }
                }
            }
            if (maxPoints.length <= 0)
                return 0;
            else if (maxPoints.length == 1)
                return maxPoints[0].x;
            else
                return (maxPoints.first.x + maxPoints.last.x) / 2;
        }
        else if (method == DefuzzifyMethod.Centroid)
        {
            let sample = (options && options["sample"]) || 20;
            let sum1 = 0, sum2 = 0;
            for (let i = 1; i <= sample; i++)
            {
                let x = i * (this.range.length / sample) + this.range.from;
                let sum = 0;
                for (let i = 0; i < this.fuzzySets.length; i++)
                {
                    sum += this.fuzzySets[i].fuzzify(x);
                }
                sum1 += x * sum;
                sum2 += sum;
            }
            return sum1 / sum2;
        }
        else if (method == DefuzzifyMethod.MaxAvg)
        {
            let sum1 = 0;
            let sum2 = 0;
            for (let i = 0; i < this.fuzzySets.length; i++)
            {
                let func = this.fuzzySets[i].fuzzyFunction;
                let max = 0;
                let maxPoints = new ArrayList();
                let avg = 0;
                for (let j = 0; j < func.points.length; j++)
                {
                    let point = func.points[j];
                    if (point.y > max)
                    {
                        max = point.y;
                        maxPoints.clear();
                        maxPoints.add(point);
                    }
                    else if (point.y == max)
                    {
                        maxPoints.add(point);
                    }
                }
                if (maxPoints.length <= 0)
                {
                    avg = 0;
                }
                else if (maxPoints.length == 1)
                {
                    avg = maxPoints[0].x;
                }
                else
                {
                    avg = (maxPoints.first.x + maxPoints.last.x) / 2;
                }
                sum1 += avg * max;
                sum2 += max;
            }
            return sum1 / sum2;
        }
        
    }
    /**
     * @returns {Ojbect}
     */
    serialize()
    {
        let obj = {
            name: this.name,
            range: this.range,
            mapToUnit: this.mapToUnit,
            fuzzySets: []
        };
        for (let i = 0; i < this.fuzzySets.length; i++)
        {
            obj.fuzzySets[obj.fuzzySets.length] = this.fuzzySets[i].serialize();
        }
        return obj;
    }
    /**
     * 
     * @param {Object} obj
     * @returns {FuzzyVariable}
     */
    static deserialize(obj)
    {
        let fuzzyVar = new FuzzyVariable(obj.name, obj.range.from, obj.range.to);
        fuzzyVar.mapToUnit = obj.mapToUnit;
        for (let i = 0; i < obj.fuzzySets.length; i++)
        {
            let fuzzySet = FuzzySet.deserialize(obj.fuzzySets[i]);
            fuzzySet.fuzzyVar = fuzzyVar;
            fuzzySet.fuzzyFunction.fuzzyVar = fuzzyVar;
            fuzzyVar.fuzzySets.add(fuzzySet);
        }
        return fuzzyVar;
    }
}
/**
 * @enum {symbol}
 * @typedef DefuzzifyMethod
 */
const DefuzzifyMethod = {
    MOM: Symbol("MOM"),
    Centroid: Symbol("Centroid"),
    MaxAvg: Symbol("MaxAvg")
}
class FuzzySet
{
    /**
     * 
     * @param {String} name 
     * @param {Number} from 
     * @param {Number} to 
     */
    constructor(name, from, to)
    {
        this.name = name;
        /**
         * @type {FuzzyFunction}
         */
        this.fuzzyFunction = new FuzzyFunction(new Range(from, to));
        /**
         * @type {Element}
         */
        this.element = null;
        this.color = new Color("#03A9F4");
    }
    /**
     * 
     * @param {Number} x 
     */
    fuzzify(x)
    {
        return this.fuzzyFunction.calculate(x);
    }

    /**
     * @returns {Object}
     */
    serialize()
    {
        let fuzzySetObj = {
            name: this.name,
            color: this.color.serialize(),
            fuzzyFunction: this.fuzzyFunction.serialize()
        };
        return fuzzySetObj;
    }
    
    /**
     * 
     * @param {Object} obj
     * @returns {FuzzySet}
     */
    static deserialize(obj)
    {
        let fuzzySet = new FuzzySet(obj.name, 0, 100);
        fuzzySet.color = Color.deserialize(obj.color);
        fuzzySet.fuzzyFunction = FuzzyFunction.deserialize(obj.fuzzyFunction);
        return fuzzySet;
    }

    /**
     * 
     * @param {Number} x
     * @param {Number} y 
     */
    resetRange(x, y)
    {
        let length = y - x;
        let range = this.fuzzyVar.range;
        for (let i = 0; i < this.fuzzyFunction.points.length; i++)
        {
            let dx = this.fuzzyFunction.points[i].x - range.from;
            dx = dx / range.length * length;
            this.fuzzyFunction.points[i].x = x + dx;
        }
    }

    get range()
    {
        return this.fuzzyFunction.range;
    }

    /**
     * @type {FuzzyVariable}
     */
    get fuzzyVar()
    {
        return this.fuzzyFunction.fuzzyVar;
    }
    /**
     * @param {FuzzyVariable} value
     */
    set fuzzyVar(value)
    {
        this.fuzzyFunction.fuzzyVar = value;
    }
}
class FuzzyFunction
{
    /**
     * 
     * @param {Range} range 
     */
    constructor(range)
    {
        /**
         * @type {Array<KeyPoint>}
         */
        this.points = new ArrayList();
        this.points.add(new KeyPoint(range.from, 1));
        this.points.add(new KeyPoint(range.to, 1));
        /**
         * @type {FuzzyVariable}
         */
        this.fuzzyVar = null;
    }
    /**
     * @type {Range}
     */
    get range()
    {
        return new Range(this.points[0].x, this.points[this.points.length - 1].x);
    }
    /**
     * @returns {FuzzyFunction}
     */
    copy()
    {
        let func = new FuzzyFunction(this.range);
        func.points[0] = new KeyPoint(this.points.first.x, this.points.first.y);
        func.points[1] = new KeyPoint(this.points.last.x, this.points.last.y);
        for (let i = 1; i < this.points.length - 1; i++)
        {
            func.addPoint(this.points[i].x, this.points[i].y);
        }
        return func;
    }
    serialize()
    {
        return {
            points: this.points
        };
    }
    /**
     * 
     * @param {Object} obj
     * @returns {FuzzyFunction}
     */
    static deserialize(obj)
    {
        let points = obj.points;
        let func = new FuzzyFunction(new Range(points[0].x, points[points.length - 1].x));
        func.points[0].y = points[0].y;
        func.points[1].y = points[points.length - 1].y;
        for (let i = 1; i < points.length - 1; i++)
        {
            func.points.add(new KeyPoint(points[i].x, points[i].y));
        }
        return func;
    }
    /**
     * 
     * @param {Number} t
     * @returns {Number}
     */
    mapToX(t)
    {
        return t * this.range.length + this.range.from;
    }
    /**
     * 
     * @param {Number} x 
     * @param {Number} y
     * @returns {KeyPoint}
     */
    addPoint(x, y)
    {
        if (x < this.range.from || x > this.range.to)
            throw new Error("Out of range.");

        var idx = this.points.length;
        for (let i = 0; i < this.points.length; i++)
        {
            if (this.points[i].x > x)
            {
                idx = i;
                break;
            }
        }
        let point = new KeyPoint(x, y);
        this.points.insert(point, idx);
        return point;
    }
    /**
     * 
     * @param {Number} x
     * @param {Boolean} [ignoreMap]
     * @returns {Number}
     */
    calculate(x, ignoreMap = false)
    {
        if (x < this.range.from || x > this.range.to)
            return 0;
        if (x == this.range.from)
            return this.points[0].y;
        for (let i = 1; i < this.points.length; i++)
        {
            if (this.points[i].x >= x)
            {
                let k = (this.points[i].y - this.points[i - 1].y) / (this.points[i].x - this.points[i - 1].x);
                let dx = x - this.points[i - 1].x;
                let dy = dx * k;
                let y = this.points[i - 1].y + dy;
                if (!ignoreMap && this.fuzzyVar && this.fuzzyVar.mapToUnit)
                {
                    let sum = 0;
                    for (let j = 0; j < this.fuzzyVar.fuzzySets.length; j++)
                    {
                        sum += this.fuzzyVar.fuzzySets[j].fuzzyFunction.calculate(x, true);
                    }
                    if (sum > 0)
                    {
                        y = y / sum;
                    }
                }
                return y;
            }
        }
        return NaN;
    }

    /**
     * @param {Number} value
     */
    cut(value)
    {
        for (let i = 0; i < this.points.length - 1; i++)
        {
            if ((this.points[i].y - value)*  (this.points[i+1].y - value)<0)
            {
                let x = f(this.points[i], this.points[i + 1]);
                this.points.insert(new KeyPoint(x, value), i + 1);
            }
        }
        for (let i = 1; i < this.points.length - 1; i++)
        {
            if (this.points[i].y > value)
            {
                this.points.removeAt(i);
                i--;
            }
        }
        this.points.first.y = this.points.first.y > value ? value : this.points.first.y;
        this.points.last.y = this.points.last.y > value ? value : this.points.last.y;

        /**
         * @param {KeyPoint} p1
         * @param {KeyPoint} p2
         * @returns {Number}
         */
        function f(p1, p2)
        {
            let dy = value - p1.y;
            let k = (p2.y - p1.y) / (p2.x - p1.x);
            let dx = dy / k;
            let x = p1.x + dx;
            return x;
        }
    }
}
class Range
{
    /**
     * 
     * @param {Number} from 
     * @param {Number} to 
     */
    constructor(from, to)
    {
        this.from = from;
        this.to = to;
    }

    get length()
    {
        return this.to - this.from;
    }
}
class KeyPoint
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}
class ArrayList extends Array
{
    add(obj)
    {
        this[this.length] = obj;
        return this;
    }
    clear()
    {
        this.length = 0;
        return this;
    }
    removeAt(idx)
    {
        for (let i = idx; i < this.length - 1; i++)
        {
            this[i] = this[i + 1];
        }
        this.length -= 1;
        return this;
    }
    remove(obj)
    {
        return this.removeAt(this.indexOf(obj));
    }
    insert(obj, idx)
    {
        this.length += 1;
        for (let i = this.length - 1; i > idx; i--)
        {
            this[i] = this[i - 1];
        }
        this[idx] = obj;
        return this;
    }

    get first()
    {
        return this[0];
    }
    set first(value)
    {
        this[0] = value;
    }
    
    get last() { return this[this.length - 1]; }
    set last(value) { this[this.length - 1] = value;}
}
class Color
{
    /**
     * 
     * @param {String | Number} r 
     * @param {Number} [g] 
     * @param {Number} [b] 
     * @param {Number} [a] 
     */
    constructor(r, g, b, a)
    {

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;

        var str = r;
        var reg = new RegExp("#[0-9a-fA-F]{6}");
        if (reg.test(str))
        {
            str = str.replace("#", "");
            var strR = str.charAt(0) + str.charAt(1);
            var strG = str.charAt(2) + str.charAt(3);
            var strB = str.charAt(4) + str.charAt(5);
            this.r = parseInt(strR, 16);
            this.g = parseInt(strG, 16);
            this.b = parseInt(strB, 16);
            this.a = 1.0;
        }
    }
    get red() { return this.r; }
    set red(value) { this.r = value; }
    get green() { return this.g; }
    set green(value) { this.g = value; }
    get blue() { return this.b; }
    set blue(value) { this.b = value; }
    get alpha() { return this.a; }
    set alpha(value) { this.a = value; }

    toString()
    {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
    
    /**
     * @returns {Color}
     */
    copy()
    {
        return new Color(this.r, this.g, this.b, this.a);
    }

    serialize()
    {
        return this;
    }

    static deserialize(obj)
    {
        return new Color(obj.r, obj.g, obj.b, obj.a);
    }
}

Window.FuzzyVariable = FuzzyVariable;