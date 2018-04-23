// FileStream.js 1.081221
// coded by inazaki keisuke
//----------------------------
function FileStream(){
  var stream = new ActiveXObject('ADODB.Stream');
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
module.exports = FileStream;
