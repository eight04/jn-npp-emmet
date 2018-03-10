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
// WMF
//------------------------------------
function dwordToArray(n){
  return new Array(n&0xff,n>>8&0xff,n>>16&0xff,n>>24&0xff);
}
function wordToArray(n){
  return new Array(n&0xff,n>>8&0xff);
}

function WMF(width,height,unitperinch){
  this.record = [];
  this.objects = 0;
  this.width = width || 512;
  this.height = height || 512;
  this.upi = unitperinch || 1440;
}
WMF.prototype = {
  moveTo : function(x,y){
    var result = [];
    result = [5,0,0,0,0x14,0x02];
    result = result.concat(wordToArray(y));
    result = result.concat(wordToArray(x));
    this.record.push(result);
  },
  lineTo : function(x,y){
    var result = [];
    result = [5,0,0,0,0x13,0x02];
    result = result.concat(wordToArray(y));
    result = result.concat(wordToArray(x));
    this.record.push(result);
  },
  rectangle : function(left,top,right,bottom){
    var result = [];
    result = [7,0,0,0,0x1B,0x04];
    result = result.concat(wordToArray(bottom));
    result = result.concat(wordToArray(right));
    result = result.concat(wordToArray(top));
    result = result.concat(wordToArray(left));
    this.record.push(result);
  },
  createPenIndirect : function(style,width,color){
    var style = style || 0;
    var width = width || 0;
    var color = color || 0;
    var result = [];
    result = [8,0,0,0,0xFA,0x02];
    result = result.concat(wordToArray(style));
    result = result.concat(dwordToArray(width));
    result = result.concat(dwordToArray(color));
    this.record.push(result);
  },
  createBrushIndirect : function(style,color,hatch){
    var style = style || 0;
    var color = color || 0;
    var hatch = hatch || 0;
    var result = [];
    result = [7,0,0,0,0xFC,0x02];
    result = result.concat(wordToArray(style));
    result = result.concat(dwordToArray(color));
    result = result.concat(wordToArray(hatch));
    this.record.push(result);
  },
  selectObject : function(objectindex){
    var result = [];
    result = [4,0,0,0,0x2D,0x01];
    result = result.concat(wordToArray(objectindex));
    this.record.push(result);
    this.objects++;
  },
  deleteObject : function(objectindex){
    var result = [];
    result = [4,0,0,0,0xF0,0x01];
    result = result.concat(wordToArray(objectindex));
    this.record.push(result);
  },
  RGB : function(r,g,b) {
    return (r&0xFF)|((g&0xFF)<<8)|((b&0xFF)<<16);
  },
  saveToFile : function(filename){
    var header = [
      //**** Aldus Placeable Metafiles (22bytes)
      0xD7,0xCD,0xC6,0x9A, // Magic number (always 9AC6CDD7h)
      0,0, // Metafile HANDLE number (always 0)
      0,0, // Left coordinate in metafile units 
      0,0 // Top coordinate in metafile units 
    ];
    // Right coordinate in metafile units 
    header = header.concat(wordToArray(this.width));
    // Bottom coordinate in metafile units 
    header = header.concat(wordToArray(this.height));
    // Number of metafile units per inch 
    header = header.concat(wordToArray(this.upi));
    header = header.concat([
      0,0,0,0, // Reserved (always 0)
      0,0, // Checksum value for previous 10 WORDs
      //**** The standard Windows metafile header (18bytes)
      1,0, // Type of metafile (0=memory, 1=disk)
      9,0, // HeaderSize in WORDs (always 9)
      0,3, // Version (this item would have the value 0x0300)
      0,0,0,0, // Total size of the metafile in WORDs 
      0,0, // Number of objects in the file
      0,0,0,0, // The size of largest record in WORDs 
      0,0 // Not Used (always 0)
    ]);
    var eor = [3,0,0,0,0,0];
    var stream = new FileStream();
    stream.open();
    stream.writeFromArray(header);
    for(var i=0; i<this.record.length; i++){
      stream.writeFromArray(this.record[i]);
    }
    stream.writeFromArray(eor);
    stream.position = 28; // Total size of the metafile
    stream.writeFromArray(dwordToArray(stream.size()));
    stream.position = 32; // Number of objects in the file
    stream.writeFromArray(wordToArray(this.objects));
    stream.position = 34; // The size of largest this.record
    var largest = 0;
    for(var i=0; i<this.record.length; i++){
      largest = Math.max(largest,this.record[i].length);
    }
    stream.writeFromArray(dwordToArray(largest));
    stream.position = 0;
    var pmh = stream.readToArray(20,[2,2,2,2,2,2,2,2,2,2]);
    var checksum = 0;
    for(var i=0; i<10; i++){ checksum ^= pmh[i]; }
    stream.position = 20; // Checksum value
    stream.writeFromArray(wordToArray(checksum));
    
    stream.saveToFile(filename);
    stream.close();
  }
};


//------------------------------------
// JAN
//------------------------------------

var JAN13 = {
  pattern : {
    A : ['0001101','0011001','0010011','0111101','0100011',
         '0110001','0101111','0111011','0110111','0001011'],
    B : ['0100111','0110011','0011011','0100001','0011101',
         '0111001','0000101','0010001','0001001','0010111'],
    C : ['1110010','1100110','1101100','1000010','1011100',
         '1001110','1010000','1000100','1001000','1110100'],
    CG : ['01010'],
    LG : ['000000000001010'],
    RG : ['0101000000000000']
  },  
  encode : [
      ['LG','A','A','A','A','A','A','CG','C','C','C','C','C','C','RG'],
      ['LG','A','A','B','A','B','B','CG','C','C','C','C','C','C','RG'],
      ['LG','A','A','B','B','A','B','CG','C','C','C','C','C','C','RG'],
      ['LG','A','A','B','B','B','A','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','A','A','B','B','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','B','A','A','B','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','B','B','A','A','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','A','B','A','B','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','A','B','B','A','CG','C','C','C','C','C','C','RG'],
      ['LG','A','B','B','A','B','A','CG','C','C','C','C','C','C','RG']
    ],
  toBarcodePattern : function(s){
    var result = '';
    var rule = this.encode[ s.charAt(0) ];
    var code = [0];
    code = code.concat(s.match(/\d/g).slice(1,7), [0]);
    code = code.concat(s.match(/\d/g).slice(7,13), [0]);
    for(var i=0; i<rule.length; i++){
      result += this.pattern[ rule[i] ][ code[i] ];
    }
    return result;
  }
}


//------------------------------------
// sample barcode.wmf
//------------------------------------

var bar = JAN13.toBarcodePattern('9790650011358');

var height = 60;
var width = bar.length;
var wmf = new WMF(width,height);
wmf.createBrushIndirect(0,wmf.RGB(0xff,0xff,0xff));
wmf.selectObject(0);
wmf.rectangle(0,0,width,height);
wmf.deleteObject(0);

wmf.createBrushIndirect(0,wmf.RGB(0,0,0));
wmf.selectObject(0);
wmf.createPenIndirect(0,0,wmf.RGB(0,0,0));
wmf.selectObject(1);

var m = bar.match(/0+1+/g);
var sx = 0;
var ex = 0;
for(i=0; i<m.length; i++){
  m[i].match(/(0+)(1+)/);
  sx = ex + RegExp.$1.length;
  ex = sx + RegExp.$2.length;
  wmf.rectangle(sx,0,ex,height);
}
wmf.deleteObject(1);
wmf.deleteObject(0);

wmf.saveToFile('sample.wmf');
