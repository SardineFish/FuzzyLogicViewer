import { $ } from "./lib/sarQuery/sarQuery.js";
let fuzzyVariables;
const colorList = [
    "#03A9F4",
    "#F44336",
    "#4CAF50",
    "#673AB7",
    "#FFC107",
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
    HTMLTemplate.Init();
    let fuzzyVariableTemplate = $("#fuzzy-variable-template")[0].template;
    let fuzzyVariableWrapper = $("#fuzzy-variable-wrapper")[0];
    fuzzyVariables.add(new FuzzyVariable("Fuzzy Variable", 0, 100));
    let templateItem = fuzzyVariableTemplate.render(fuzzyVariables[0])[0];
    templateItem.insertInto(fuzzyVariableWrapper);
    initFuzzyVarView(fuzzyVariables[0], templateItem.firstElement);
}
/**
 * 
 * @param {FuzzyVariable} fuzzyVar 
 * @param {Element} element 
 */
function initFuzzyVarView(fuzzyVar, element)
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
        let fuzzySet = new FuzzySet("Fuzzy Set", fuzzyVar.range.from, fuzzyVar.range.to);
        fuzzySet.color = new Color(colorList[fuzzyVar.fuzzySets.length]);
        fuzzyVar.addFuzzySet(fuzzySet);
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

    fuzzyVar.addFuzzySet(new FuzzySet("Fuzzy Set", fuzzyVar.range.from, fuzzyVar.range.to));
}

/**
 * 
 * @param {FuzzyVariable} fuzzyVar 
 * @param {FuzzySet} fuzzySet 
 */
function initFuzzySet(fuzzyVar, fuzzySet)
{
    let fuzzSetTemplate = $(fuzzyVar.element, ".fuzz-set-template ")[0].template;
    let buttonAddFuzzSet = $(fuzzyVar.element, ".fuzzy-set-add");
    let templateItem = fuzzSetTemplate.render({
        name: "Fuzzy Set",
        range: {
            from: 0,
            to: 100
        }
    })[0];
    templateItem.insertBefore(buttonAddFuzzSet[0]);
    fuzzySet.element = templateItem.firstElement;

    fuzzyVar.graph.addFunction(fuzzySet.fuzzyFunction, fuzzySet.color);
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
        this.mousePos = { x: -1000, y: -1000 };
        /**
         * @type {Array<FuzzyFunction>}
         */
        this.funcList = new ArrayList();

        this.initInput();
    }

    /**
     * 
     * @param {FuzzyFunction} func
     * @param {Color} color
     */
    addFunction(func, color)
    {
        this.funcList.add(func);
        
        let comb = new Combination();
        let obj = new GameObject();
        obj.graphic = comb;
        this.scene.addGameObject(obj);

        const graph = this;
        const fillColor = color.copy();
        fillColor.alpha = 0.2;
        obj.onUpdate = function ()
        {
            comb.objectList.clear();
            let path = new Path();
            let pathFill = new Path();
            if (func.fuzzyVar.mapToUnit)
            {
                for (let i = 0; i <= graph.sample; i++)
                {
                    let x = i / graph.sample * graph.range.length;
                    
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
                    x = x * graph.width / graph.range.length;
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
                    let x = point.x * graph.width / graph.range.length;
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
            let y = func.calculate(x * graph.range.length / graph.width) * graph.height;
            let circle = new Circle(5);
            circle.strokeStyle = "#03A9F4";
            circle.fillStyle = "#03A9F4";
            circle.moveTo(x, y);
            comb.addObject(circle);
        }
    }

    initInput()
    {
        const graph = this;
        let mouseOnline = false;
        let pointEditing = null;
        this.scene.onMouseMove = function (e)
        {
            let x = e.x;
            let y = e.y;
            x = x < 0 ? 0 : x;
            x = x > graph.width ? graph.width : x;
            y = y < 0 ? 0 : y;
            y = y > graph.height ? graph.height : y;
            graph.mousePos = { x: x, y: e.y };
            mouseOnline = false;

            if (graph.onMouseMove)
            {
                graph.onMouseMove(x * graph.range.length / graph.width);
            }
            if (pointEditing)
            {
                pointEditing.x = x * graph.range.length / graph.width;
                pointEditing.y = y / graph.height;
                return;
            }

            for (let i = 0; i < graph.funcList.length; i++)
            {
                let y = graph.funcList[i].calculate(x * graph.range.length / graph.width) * graph.height;
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
            let x = e.x;
            x = x < 0 ? 0 : x;
            x = x > graph.width ? graph.width : x;
            if (!mouseOnline)
                return;
            let min = Number.MAX_VALUE;
            let hoverFunc = null;

            for (let i = 0; i < graph.funcList.length; i++)
            {
                let y = graph.funcList[i].calculate(x * graph.range.length / graph.width) * graph.height;
                if (Math.abs(y - e.y) < min)
                {
                    min = Math.abs(y - e.y);
                    hoverFunc = graph.funcList[i];
                }
            }
            for (let i = 0; i < hoverFunc.points.length; i++)
            {
                if (Math.abs(x - hoverFunc.points[i].x * graph.width / graph.range.length) < 10)
                {
                    pointEditing = hoverFunc.points[i];
                    break;
                }
            }
            if (! pointEditing)
            {
                x = x * graph.range.length / graph.width;
                let y = hoverFunc.calculate(x);
                pointEditing = hoverFunc.addPoint(x, y);
            }
        }
        this.scene.onMouseUp = function (e)
        {
            pointEditing = null;
        }
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
        initFuzzySet(this, fuzzySet);
    }
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
                if (!ignoreMap && this.fuzzyVar.mapToUnit)
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
}