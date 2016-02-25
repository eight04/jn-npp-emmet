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

//------------------------------------
//sample square wave 
//------------------------------------
function dwordToArray(n){
  return new Array(n&0xff,n>>8&0xff,n>>16&0xff,n>>24&0xff);
}
var second = 1;
var samplingrate = 8000;
var frequency = 440;
var wavelength = Math.floor(samplingrate/frequency);
var header = [
  0x52,0x49,0x46,0x46, // 'RIFF'
  0,0,0,0, // filesize-8
  0x57,0x41,0x56,0x45, // 'WAVE'
  0x66,0x6d,0x74,0x20, // 'fmt '
  0x10,0,0,0, // chunksize
  1,0, // formatid
  1,0 // channel 1=mono,2=stereo
];
header = header.concat(
  dwordToArray(samplingrate)); // sampling rate 8k=0x1f40
header = header.concat([
  0x40,0x1f,0,0, // byte per sec =sampling rate*channel*(bit/8)
  1,0, // blocksize =(bit/8) *channel
  8,0, // bit(bit per sample) 8bit
  0x64,0x61,0x74,0x61, // 'data'
  0,0,0,0 // datasize
]);
var stream = new FileStream();
stream.open();
stream.writeFromArray(header);
var buffer = [];
var fin = 0;
for(; fin<(samplingrate*second); fin++){
  buffer.push((fin%wavelength)<(wavelength/2) ? 0xc0 : 0x40 );
  if(buffer.length>=512){
    stream.writeFromArray(buffer);
    buffer = [];
  }
}
stream.writeFromArray(buffer);
stream.position = 40; // datasize
stream.writeFromArray(dwordToArray(fin));
stream.position = 4; // filesize-8
stream.writeFromArray(dwordToArray(fin+36));
stream.saveToFile('sample.wav');
stream.close();
