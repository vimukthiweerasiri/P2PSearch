/**
 * Created by vimukthi on 1/11/16.
 */
var shuffle = function(obj1, obj2) {
    var l = obj1.length,
        i = 0,
        rnd,
        tmp1,
        tmp2;

    while (i < l) {
        rnd = Math.floor(Math.random() * i);
        tmp1 = obj1[i];
        tmp2 = obj2[i];
        obj1[i] = obj1[rnd];
        obj2[i] = obj2[rnd];
        obj1[rnd] = tmp1;
        obj2[rnd] = tmp2;
        i += 1;
    }
}
var shuffleArray = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}
exports.shuffle = shuffle;
exports.shuffleArray = shuffleArray;