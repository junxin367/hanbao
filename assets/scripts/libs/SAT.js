





/** @preserve SAT.js - Version 0.9.0 - Copyright 2012 - 2021 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */

/*global define: false, module: false*/
/*jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true,
  eqeqeq:true, bitwise:true, strict:true, undef:true,
  curly:true, browser:true */









/**
 * @param {*} root - The global scope
 * @param {Function} factory - Factory that creates SAT module
 */
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define['amd']) {
        define(factory);
    } else if (typeof exports === 'object') {
        module['exports'] = factory();
    } else {
        root['SAT'] = factory();
    }
}(this, function () {
    "use strict";

    var SAT = {};









    /**
     * @param {?number=} x The x position.
     * @param {?number=} y The y position.
     * @constructor
     */
    function Vector(x, y) {
        this['x'] = x || 0;
        this['y'] = y || 0;
    }
    SAT['Vector'] = Vector;

    SAT['V'] = Vector;



    /**
     * @param {Vector} other The other Vector.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['copy'] = Vector.prototype.copy = function (other) {
        this['x'] = other['x'];
        this['y'] = other['y'];
        return this;
    };


    /**
     * @return {Vector} The new cloned vector
     */
    Vector.prototype['clone'] = Vector.prototype.clone = function () {
        return new Vector(this['x'], this['y']);
    };



    /**
     * @return {Vector} This for chaining.
     */
    Vector.prototype['perp'] = Vector.prototype.perp = function () {
        var x = this['x'];
        this['x'] = this['y'];
        this['y'] = -x;
        return this;
    };


    /**
     * @param {number} angle The angle to rotate (in radians)
     * @return {Vector} This for chaining.
     */
    Vector.prototype['rotate'] = Vector.prototype.rotate = function (angle) {
        var x = this['x'];
        var y = this['y'];
        this['x'] = x * Math.cos(angle) - y * Math.sin(angle);
        this['y'] = x * Math.sin(angle) + y * Math.cos(angle);
        return this;
    };


    /**
     * @return {Vector} This for chaining.
     */
    Vector.prototype['reverse'] = Vector.prototype.reverse = function () {
        this['x'] = -this['x'];
        this['y'] = -this['y'];
        return this;
    };



    /**
     * @return {Vector} This for chaining.
     */
    Vector.prototype['normalize'] = Vector.prototype.normalize = function () {
        var d = this.len();
        if (d > 0) {
            this['x'] = this['x'] / d;
            this['y'] = this['y'] / d;
        }
        return this;
    };


    /**
     * @param {Vector} other The other Vector.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['add'] = Vector.prototype.add = function (other) {
        this['x'] += other['x'];
        this['y'] += other['y'];
        return this;
    };


    /**
     * @param {Vector} other The other Vector.
     * @return {Vector} This for chaiing.
     */
    Vector.prototype['sub'] = Vector.prototype.sub = function (other) {
        this['x'] -= other['x'];
        this['y'] -= other['y'];
        return this;
    };



    /**
     * @param {number} x The scaling factor in the x direction.
     * @param {?number=} y The scaling factor in the y direction.  If this
     *   is not specified, the x scaling factor will be used.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['scale'] = Vector.prototype.scale = function (x, y) {
        this['x'] *= x;
        this['y'] *= typeof y != 'undefined' ? y : x;
        return this;
    };


    /**
     * @param {Vector} other The vector to project onto.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['project'] = Vector.prototype.project = function (other) {
        var amt = this.dot(other) / other.len2();
        this['x'] = amt * other['x'];
        this['y'] = amt * other['y'];
        return this;
    };



    /**
     * @param {Vector} other The unit vector to project onto.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['projectN'] = Vector.prototype.projectN = function (other) {
        var amt = this.dot(other);
        this['x'] = amt * other['x'];
        this['y'] = amt * other['y'];
        return this;
    };


    /**
     * @param {Vector} axis The vector representing the axis.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['reflect'] = Vector.prototype.reflect = function (axis) {
        var x = this['x'];
        var y = this['y'];
        this.project(axis).scale(2);
        this['x'] -= x;
        this['y'] -= y;
        return this;
    };



    /**
     * @param {Vector} axis The unit vector representing the axis.
     * @return {Vector} This for chaining.
     */
    Vector.prototype['reflectN'] = Vector.prototype.reflectN = function (axis) {
        var x = this['x'];
        var y = this['y'];
        this.projectN(axis).scale(2);
        this['x'] -= x;
        this['y'] -= y;
        return this;
    };


    /**
     * @param {Vector}  other The vector to dot this one against.
     * @return {number} The dot product.
     */
    Vector.prototype['dot'] = Vector.prototype.dot = function (other) {
        return this['x'] * other['x'] + this['y'] * other['y'];
    };


    /**
     * @return {number} The length^2 of this vector.
     */
    Vector.prototype['len2'] = Vector.prototype.len2 = function () {
        return this.dot(this);
    };


    /**
     * @return {number} The length of this vector.
     */
    Vector.prototype['len'] = Vector.prototype.len = function () {
        return Math.sqrt(this.len2());
    };








    /**
     * @param {Vector=} pos A vector representing the position of the center of the circle
     * @param {?number=} r The radius of the circle
     * @constructor
     */
    function Circle(pos, r) {
        this['pos'] = pos || new Vector();
        this['r'] = r || 0;
        this['offset'] = new Vector();
    }
    SAT['Circle'] = Circle;




    /**
     * @return {Polygon} The AABB
     */
    Circle.prototype['getAABBAsBox'] = Circle.prototype.getAABBAsBox = function () {
        var r = this['r'];
        var corner = this['pos'].clone().add(this['offset']).sub(new Vector(r, r));
        return new Box(corner, r * 2, r * 2);
    };




    /**
     * @return {Polygon} The AABB
     */
    Circle.prototype['getAABB'] = Circle.prototype.getAABB = function () {
        return this.getAABBAsBox().toPolygon();
    };


    /**
     * @param {Vector} offset The new offset vector.
     * @return {Circle} This for chaining.
     */
    Circle.prototype['setOffset'] = Circle.prototype.setOffset = function (offset) {
        this['offset'] = offset;
        return this;
    };













    /**
     * @param {Vector=} pos A vector representing the origin of the polygon. (all other
     *   points are relative to this one)
     * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
     *   in counter-clockwise order.
     * @constructor
     */
    function Polygon(pos, points) {
        this['pos'] = pos || new Vector();
        this['angle'] = 0;
        this['offset'] = new Vector();
        this.setPoints(points || []);
    }
    SAT['Polygon'] = Polygon;







    /**
     * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
     *   in counter-clockwise order.
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype['setPoints'] = Polygon.prototype.setPoints = function (points) {

        var lengthChanged = !this['points'] || this['points'].length !== points.length;
        if (lengthChanged) {
            var i;
            var calcPoints = this['calcPoints'] = [];
            var edges = this['edges'] = [];
            var normals = this['normals'] = [];

            for (i = 0; i < points.length; i++) {

                var p1 = points[i];
                var p2 = i < points.length - 1 ? points[i + 1] : points[0];
                if (p1 !== p2 && p1.x === p2.x && p1.y === p2.y) {
                    points.splice(i, 1);
                    i -= 1;
                    continue;
                }
                calcPoints.push(new Vector());
                edges.push(new Vector());
                normals.push(new Vector());
            }
        }
        this['points'] = points;
        this._recalc();
        return this;
    };


    /**
     * @param {number} angle The current rotation angle (in radians).
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype['setAngle'] = Polygon.prototype.setAngle = function (angle) {
        this['angle'] = angle;
        this._recalc();
        return this;
    };


    /**
     * @param {Vector} offset The new offset vector.
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype['setOffset'] = Polygon.prototype.setOffset = function (offset) {
        this['offset'] = offset;
        this._recalc();
        return this;
    };




    /**
     * @param {number} angle The angle to rotate (in radians)
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype['rotate'] = Polygon.prototype.rotate = function (angle) {
        var points = this['points'];
        var len = points.length;
        for (var i = 0; i < len; i++) {
            points[i].rotate(angle);
        }
        this._recalc();
        return this;
    };








    /**
     * @param {number} x The horizontal amount to translate.
     * @param {number} y The vertical amount to translate.
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype['translate'] = Polygon.prototype.translate = function (x, y) {
        var points = this['points'];
        var len = points.length;
        for (var i = 0; i < len; i++) {
            points[i]['x'] += x;
            points[i]['y'] += y;
        }
        this._recalc();
        return this;
    };




    /**
     * @return {Polygon} This for chaining.
     */
    Polygon.prototype._recalc = function () {


        var calcPoints = this['calcPoints'];



        var edges = this['edges'];



        var normals = this['normals'];

        var points = this['points'];
        var offset = this['offset'];
        var angle = this['angle'];
        var len = points.length;
        var i;
        for (i = 0; i < len; i++) {
            var calcPoint = calcPoints[i].copy(points[i]);
            calcPoint['x'] += offset['x'];
            calcPoint['y'] += offset['y'];
            if (angle !== 0) {
                calcPoint.rotate(angle);
            }
        }

        for (i = 0; i < len; i++) {
            var p1 = calcPoints[i];
            var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
            var e = edges[i].copy(p2).sub(p1);
            normals[i].copy(e).perp().normalize();
        }
        return this;
    };






    /**
     * @return {Polygon} The AABB
     */
    Polygon.prototype['getAABBAsBox'] = Polygon.prototype.getAABBAsBox = function () {
        var points = this['calcPoints'];
        var len = points.length;
        var xMin = points[0]['x'];
        var yMin = points[0]['y'];
        var xMax = points[0]['x'];
        var yMax = points[0]['y'];
        for (var i = 1; i < len; i++) {
            var point = points[i];
            if (point['x'] < xMin) {
                xMin = point['x'];
            } else if (point['x'] > xMax) {
                xMax = point['x'];
            }
            if (point['y'] < yMin) {
                yMin = point['y'];
            } else if (point['y'] > yMax) {
                yMax = point['y'];
            }
        }
        return new Box(this['pos'].clone().add(new Vector(xMin, yMin)), xMax - xMin, yMax - yMin);
    };






    /**
     * @return {Polygon} The AABB
     */
    Polygon.prototype['getAABB'] = Polygon.prototype.getAABB = function () {
        return this.getAABBAsBox().toPolygon();
    };







    /**
     * @return {Vector} A Vector that contains the coordinates of the Centroid.
     */
    Polygon.prototype['getCentroid'] = Polygon.prototype.getCentroid = function () {
        var points = this['calcPoints'];
        var len = points.length;
        var cx = 0;
        var cy = 0;
        var ar = 0;
        for (var i = 0; i < len; i++) {
            var p1 = points[i];
            var p2 = i === len - 1 ? points[0] : points[i + 1]; // Loop around if last point
            var a = p1['x'] * p2['y'] - p2['x'] * p1['y'];
            cx += (p1['x'] + p2['x']) * a;
            cy += (p1['y'] + p2['y']) * a;
            ar += a;
        }
        ar = ar * 3; // we want 1 / 6 the area and we currently have 2*area
        cx = cx / ar;
        cy = cy / ar;
        return new Vector(cx, cy);
    };










    /**
     * @param {Vector=} pos A vector representing the bottom-left of the box (i.e. the smallest x and smallest y value).
     * @param {?number=} w The width of the box.
     * @param {?number=} h The height of the box.
     * @constructor
     */
    function Box(pos, w, h) {
        this['pos'] = pos || new Vector();
        this['w'] = w || 0;
        this['h'] = h || 0;
    }
    SAT['Box'] = Box;


    /**
     * @return {Polygon} A new Polygon that represents this box.
     */
    Box.prototype['toPolygon'] = Box.prototype.toPolygon = function () {
        var pos = this['pos'];
        var w = this['w'];
        var h = this['h'];
        return new Polygon(new Vector(pos['x'], pos['y']), [
            new Vector(), new Vector(w, 0),
            new Vector(w, h), new Vector(0, h)
        ]);
    };









    /**
     * @constructor
     */
    function Response() {
        this['a'] = null;
        this['b'] = null;
        this['overlapN'] = new Vector();
        this['overlapV'] = new Vector();
        this.clear();
    }
    SAT['Response'] = Response;




    /**
     * @return {Response} This for chaining
     */
    Response.prototype['clear'] = Response.prototype.clear = function () {
        this['aInB'] = true;
        this['bInA'] = true;
        this['overlap'] = Number.MAX_VALUE;
        return this;
    };





    /**
     * @type {Array<Vector>}
     */
    var T_VECTORS = [];
    for (var i = 0; i < 10; i++) {
        T_VECTORS.push(new Vector());
    }



    /**
     * @type {Array<Array<number>>}
     */
    var T_ARRAYS = [];
    for (var i = 0; i < 5; i++) {
        T_ARRAYS.push([]);
    }


    /**
     * @type {Response}
     */
    var T_RESPONSE = new Response();


    /**
     * @type {Polygon}
     */
    var TEST_POINT = new Box(new Vector(), 0.000001, 0.000001).toPolygon();






    /**
     * @param {Array<Vector>} points The points to flatten.
     * @param {Vector} normal The unit vector axis to flatten on.
     * @param {Array<number>} result An array.  After calling this function,
     *   result[0] will be the minimum value,
     *   result[1] will be the maximum value.
     */
    function flattenPointsOn(points, normal, result) {
        var min = Number.MAX_VALUE;
        var max = -Number.MAX_VALUE;
        var len = points.length;
        for (var i = 0; i < len; i++) {

            var dot = points[i].dot(normal);
            if (dot < min) {
                min = dot;
            }
            if (dot > max) {
                max = dot;
            }
        }
        result[0] = min;
        result[1] = max;
    }



    /**
     * @param {Vector} aPos The position of the first polygon.
     * @param {Vector} bPos The position of the second polygon.
     * @param {Array<Vector>} aPoints The points in the first polygon.
     * @param {Array<Vector>} bPoints The points in the second polygon.
     * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
     *   will be projected onto this axis.
     * @param {Response=} response A Response object (optional) which will be populated
     *   if the axis is not a separating axis.
     * @return {boolean} true if it is a separating axis, false otherwise.  If false,
     *   and a response is passed in, information about how much overlap and
     *   the direction of the overlap will be populated.
     */
    function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
        var rangeA = T_ARRAYS.pop();
        var rangeB = T_ARRAYS.pop();

        var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
        var projectedOffset = offsetV.dot(axis);

        flattenPointsOn(aPoints, axis, rangeA);
        flattenPointsOn(bPoints, axis, rangeB);

        rangeB[0] += projectedOffset;
        rangeB[1] += projectedOffset;

        if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
            T_VECTORS.push(offsetV);
            T_ARRAYS.push(rangeA);
            T_ARRAYS.push(rangeB);
            return true;
        }

        if (response) {
            var overlap = 0;

            if (rangeA[0] < rangeB[0]) {
                response['aInB'] = false;

                if (rangeA[1] < rangeB[1]) {
                    overlap = rangeA[1] - rangeB[0];
                    response['bInA'] = false;

                } else {
                    var option1 = rangeA[1] - rangeB[0];
                    var option2 = rangeB[1] - rangeA[0];
                    overlap = option1 < option2 ? option1 : -option2;
                }

            } else {
                response['bInA'] = false;

                if (rangeA[1] > rangeB[1]) {
                    overlap = rangeA[0] - rangeB[1];
                    response['aInB'] = false;

                } else {
                    var option1 = rangeA[1] - rangeB[0];
                    var option2 = rangeB[1] - rangeA[0];
                    overlap = option1 < option2 ? option1 : -option2;
                }
            }

            var absOverlap = Math.abs(overlap);
            if (absOverlap < response['overlap']) {
                response['overlap'] = absOverlap;
                response['overlapN'].copy(axis);
                if (overlap < 0) {
                    response['overlapN'].reverse();
                }
            }
        }
        T_VECTORS.push(offsetV);
        T_ARRAYS.push(rangeA);
        T_ARRAYS.push(rangeB);
        return false;
    }
    SAT['isSeparatingAxis'] = isSeparatingAxis;







    /**
     * @param {Vector} line The line segment.
     * @param {Vector} point The point.
     * @return  {number} LEFT_VORONOI_REGION (-1) if it is the left region,
     *          MIDDLE_VORONOI_REGION (0) if it is the middle region,
     *          RIGHT_VORONOI_REGION (1) if it is the right region.
     */
    function voronoiRegion(line, point) {
        var len2 = line.len2();
        var dp = point.dot(line);


        if (dp < 0) {
            return LEFT_VORONOI_REGION;
        }


        else if (dp > len2) {
            return RIGHT_VORONOI_REGION;
        }

        else {
            return MIDDLE_VORONOI_REGION;
        }
    }

    /**
     * @const
     */
    var LEFT_VORONOI_REGION = -1;
    /**
     * @const
     */
    var MIDDLE_VORONOI_REGION = 0;
    /**
     * @const
     */
    var RIGHT_VORONOI_REGION = 1;




    /**
     * @param {Vector} p The point to test.
     * @param {Circle} c The circle to test.
     * @return {boolean} true if the point is inside the circle, false if it is not.
     */
    function pointInCircle(p, c) {
        var differenceV = T_VECTORS.pop().copy(p).sub(c['pos']).sub(c['offset']);
        var radiusSq = c['r'] * c['r'];
        var distanceSq = differenceV.len2();
        T_VECTORS.push(differenceV);

        return distanceSq <= radiusSq;
    }
    SAT['pointInCircle'] = pointInCircle;


    /**
     * @param {Vector} p The point to test.
     * @param {Polygon} poly The polygon to test.
     * @return {boolean} true if the point is inside the polygon, false if it is not.
     */
    function pointInPolygon(p, poly) {
        TEST_POINT['pos'].copy(p);
        T_RESPONSE.clear();
        var result = testPolygonPolygon(TEST_POINT, poly, T_RESPONSE);
        if (result) {
            result = T_RESPONSE['aInB'];
        }
        return result;
    }
    SAT['pointInPolygon'] = pointInPolygon;


    /**
     * @param {Circle} a The first circle.
     * @param {Circle} b The second circle.
     * @param {Response=} response Response object (optional) that will be populated if
     *   the circles intersect.
     * @return {boolean} true if the circles intersect, false if they don't.
     */
    function testCircleCircle(a, b, response) {


        var differenceV = T_VECTORS.pop().copy(b['pos']).add(b['offset']).sub(a['pos']).sub(a['offset']);
        var totalRadius = a['r'] + b['r'];
        var totalRadiusSq = totalRadius * totalRadius;
        var distanceSq = differenceV.len2();

        if (distanceSq > totalRadiusSq) {
            T_VECTORS.push(differenceV);
            return false;
        }

        if (response) {
            var dist = Math.sqrt(distanceSq);
            response['a'] = a;
            response['b'] = b;
            response['overlap'] = totalRadius - dist;
            response['overlapN'].copy(differenceV.normalize());
            response['overlapV'].copy(differenceV).scale(response['overlap']);
            response['aInB'] = a['r'] <= b['r'] && dist <= b['r'] - a['r'];
            response['bInA'] = b['r'] <= a['r'] && dist <= a['r'] - b['r'];
        }
        T_VECTORS.push(differenceV);
        return true;
    }
    SAT['testCircleCircle'] = testCircleCircle;


    /**
     * @param {Polygon} polygon The polygon.
     * @param {Circle} circle The circle.
     * @param {Response=} response Response object (optional) that will be populated if
     *   they interset.
     * @return {boolean} true if they intersect, false if they don't.
     */
    function testPolygonCircle(polygon, circle, response) {

        var circlePos = T_VECTORS.pop().copy(circle['pos']).add(circle['offset']).sub(polygon['pos']);
        var radius = circle['r'];
        var radius2 = radius * radius;
        var points = polygon['calcPoints'];
        var len = points.length;
        var edge = T_VECTORS.pop();
        var point = T_VECTORS.pop();


        for (var i = 0; i < len; i++) {
            var next = i === len - 1 ? 0 : i + 1;
            var prev = i === 0 ? len - 1 : i - 1;
            var overlap = 0;
            var overlapN = null;


            edge.copy(polygon['edges'][i]);

            point.copy(circlePos).sub(points[i]);




            if (response && point.len2() > radius2) {
                response['aInB'] = false;
            }


            var region = voronoiRegion(edge, point);

            if (region === LEFT_VORONOI_REGION) {

                edge.copy(polygon['edges'][prev]);

                var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
                region = voronoiRegion(edge, point2);
                if (region === RIGHT_VORONOI_REGION) {

                    var dist = point.len();
                    if (dist > radius) {

                        T_VECTORS.push(circlePos);
                        T_VECTORS.push(edge);
                        T_VECTORS.push(point);
                        T_VECTORS.push(point2);
                        return false;
                    } else if (response) {

                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }
                T_VECTORS.push(point2);

            } else if (region === RIGHT_VORONOI_REGION) {

                edge.copy(polygon['edges'][next]);

                point.copy(circlePos).sub(points[next]);
                region = voronoiRegion(edge, point);
                if (region === LEFT_VORONOI_REGION) {

                    var dist = point.len();
                    if (dist > radius) {

                        T_VECTORS.push(circlePos);
                        T_VECTORS.push(edge);
                        T_VECTORS.push(point);
                        return false;
                    } else if (response) {

                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }

            } else {


                var normal = edge.perp().normalize();


                var dist = point.dot(normal);
                var distAbs = Math.abs(dist);

                if (dist > 0 && distAbs > radius) {

                    T_VECTORS.push(circlePos);
                    T_VECTORS.push(normal);
                    T_VECTORS.push(point);
                    return false;
                } else if (response) {

                    overlapN = normal;
                    overlap = radius - dist;


                    if (dist >= 0 || overlap < 2 * radius) {
                        response['bInA'] = false;
                    }
                }
            }



            if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
                response['overlap'] = overlap;
                response['overlapN'].copy(overlapN);
            }
        }


        if (response) {
            response['a'] = polygon;
            response['b'] = circle;
            response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
        }
        T_VECTORS.push(circlePos);
        T_VECTORS.push(edge);
        T_VECTORS.push(point);
        return true;
    }
    SAT['testPolygonCircle'] = testPolygonCircle;





    /**
     * @param {Circle} circle The circle.
     * @param {Polygon} polygon The polygon.
     * @param {Response=} response Response object (optional) that will be populated if
     *   they interset.
     * @return {boolean} true if they intersect, false if they don't.
     */
    function testCirclePolygon(circle, polygon, response) {

        var result = testPolygonCircle(polygon, circle, response);
        if (result && response) {

            var a = response['a'];
            var aInB = response['aInB'];
            response['overlapN'].reverse();
            response['overlapV'].reverse();
            response['a'] = response['b'];
            response['b'] = a;
            response['aInB'] = response['bInA'];
            response['bInA'] = aInB;
        }
        return result;
    }
    SAT['testCirclePolygon'] = testCirclePolygon;


    /**
     * @param {Polygon} a The first polygon.
     * @param {Polygon} b The second polygon.
     * @param {Response=} response Response object (optional) that will be populated if
     *   they interset.
     * @return {boolean} true if they intersect, false if they don't.
     */
    function testPolygonPolygon(a, b, response) {
        var aPoints = a['calcPoints'];
        var aLen = aPoints.length;
        var bPoints = b['calcPoints'];
        var bLen = bPoints.length;

        for (var i = 0; i < aLen; i++) {
            if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, a['normals'][i], response)) {
                return false;
            }
        }

        for (var i = 0; i < bLen; i++) {
            if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, b['normals'][i], response)) {
                return false;
            }
        }



        if (response) {
            response['a'] = a;
            response['b'] = b;
            response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
        }
        return true;
    }
    SAT['testPolygonPolygon'] = testPolygonPolygon;

    return SAT;
}));