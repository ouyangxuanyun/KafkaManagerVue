var a = [1,2,3,4];
var len = a.length = 0;
console.log(a)
a['a'] = "aaa";len++;
a["b"] = "bbb";len++

console.log(a);
console.log(a.length);
console.log(JSON.stringify(a));
// console.log(JSON.parse(a));
