// FileStream.js 1.081030
// coded by inazaki keisuke
//
function FileStream(){
  var stream = WScript.CreateObject('ADODB.Stream');
  this.position = 0;
  this.isLittleEndian = true;
  this.open = function(){
    stream.Type = 2; //adTypeText
    stream.Charset = 'iso-8859-1';
    stream.Open();
  }
  this.close = function(){
    stream.Close();
    this.position = 0;
  }
  this.eos = function(){
    return stream.EOS;
  }
  this.size = function(){
    return stream.Size;
  }
  this.loadFromFile = function(filename){
    stream.LoadFromFile(filename);
  }
  this.saveToFile = function(filename,option){
    var option = option || 2; //adSaveCreateOverWrite
    stream.SaveToFile(filename,option);
  }
  this.readToString = function(size){
    var result='';
    stream.Position = 0;
    stream.Charset = 'ascii';
    stream.Position = this.position;
    var s1 = stream.ReadText(size);
    stream.Position = 0;
    stream.Charset = 'iso-8859-1';
    stream.Position = this.position;
    var s2 = stream.ReadText(size);
    this.position = stream.Position;
    for(var i=0; i<s1.length; i++){
      result += ('0'+(s1.charCodeAt(i)|(s2.charCodeAt(i)<0x80?0:0x80))
        .toString(16)).slice(-2);
    }
    s1 = s2 = null;
    return result;
  }
  this.readToArray = function(size,option){
    var result = [];
    var option = option || [];
    var s = this.readToString(size);
    for(var i=0; i<s.length;){
      var sz = (option.length > 0) ? option.shift() * 2 : 2 ;
      var st = s.substr(i,sz).match(/(\w{2})/g);
      if(this.isLittleEndian) st = st.reverse();
      result.push(parseInt(st.join(''),16));
      i+=sz;
    }
    s = null;
    return result;
  }
  this.writeFromString = function(str){
    stream.Position = 0;
    stream.Charset = 'iso-8859-1';
    stream.Position = this.position;
    for(var i=0; i<str.length; i+=2){
      stream.WriteText(String.fromCharCode(
        parseInt(str.substr(i,2),16)));
    }
    this.position = stream.Position;
  }
  this.writeFromArray = function(arr){
    stream.Position = 0;
    stream.Charset = 'iso-8859-1';
    stream.Position = this.position;
    for(var i=0; i<arr.length; i++){
      stream.WriteText(String.fromCharCode(arr[i]&0xFF));
    }
    this.position = stream.Position;
  }
}

//-----------------------------------------------
// sample dump script
//-----------------------------------------------

String.prototype.lpad = function(length,padding){
  var result = this;
  var length = length || 1;
  var padding = padding || ' ';
  while((length-result.length)>0) result = padding + result;
  return result;
}
String.prototype.times = function(count){
  for(var i=0,result=''; i<count; i++) result += this;
  return result;
}

function getParameterForNumber(prm,def,min,max){
  var n = parseInt(WScript.Arguments.Named(prm));
  return isNaN(n)? def: ((n<min)||(n>max))? def: n;
}
function arrayToString(array){
  for(var i=0; i<array.length; i++)
    array[i] = String.fromCharCode(array[i]&0xFF);
  return array.join('');
}

var width = getParameterForNumber('width',null,1,32) ||
            getParameterForNumber('w',null,1,32) || 8;
var radix = getParameterForNumber('radix',null,2,36) ||
            getParameterForNumber('r',null,2,36) || 16;
var offset = getParameterForNumber('offset',null,0) ||
             getParameterForNumber('o',null,0) || 0;
var readall = WScript.Arguments.Named.Exists('all');

if(WScript.Arguments.UnNamed.Count!=1) {
  var usage = [
    'usage :',
    '  dump <filename> [option]',
    'option :',
    '  /offset:0-     (or /o)',
    '  /width:1-32    (or /w)',
    '  /radix:2-36    (or /r)',
    '  /all',
    'example :',
    '  cscript dump.js readme.html /o:100 /w:12'].join('\r\n');
  WScript.StdErr.WriteLine(usage);
  WScript.Quit(1);
}

try{
  var size = (readall)? -1: width * 6;
  var blen = (radix==2)?8: (radix==3)?6: (radix<=6)?4: (radix<=15)?3: 2;
  var space = ' '.times(512);
  var stream = new FileStream();
  stream.open();
  stream.loadFromFile(WScript.Arguments.Item(0));
  stream.position = offset;
  do{
    WScript.StdOut.Write('\n');
    var buffer = stream.readToArray(size);
    for(var address=offset; buffer.length!=0; address+=width){
      var bstr = '',cstr='';
      cstr += arrayToString(buffer.slice(0,width))
        .replace(/[\x00-\x1f\x7f-\xff]/g,'.');
      for(var i=0; (i<width)&&(buffer.length!=0); i++){
        bstr += (buffer.shift()).toString(radix).toUpperCase().lpad(blen,'0');
      }
      WScript.StdOut.WriteLine(address.toString(16).lpad(8,'0')+' : '+
        (bstr.replace((new RegExp('(\\w{'+blen+'})','g')),'$1 ') + space)
          .substr(0,width*blen+width+4) + cstr);
    }
    offset=address;
    if(stream.eos()) break;
    WScript.StdOut.Write('\n if continue [Enter] / quit [type q] >> ');
  }while(!WScript.StdIn.ReadLine().match(/\s*q\s*/))
}catch(e){
  WScript.StdOut.Write('Exception: ');
  WScript.StdOut.WriteLine((e instanceof Error)? e.message: e);
}

