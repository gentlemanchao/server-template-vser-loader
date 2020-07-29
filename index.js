const Fs = require('fs');
const Path = require('path');

const ParseConfig = require('./src/parseConfig');

module.exports = function (fileContent) {
    if (/module\.exports\s?=/.test(fileContent)) {
        fileContent = fileContent.replace(/module\.exports\s?=\s?/, '');
    } else fileContent = JSON.stringify(fileContent);
    fileContent = removeRemark(fileContent);
    const path = this.context;
    const configPath = `${path}\\config.js`;
    if (checkFileExist(configPath)) {
        const configStr = readFile(configPath);
        const config = ParseConfig(configStr);
        fileContent = parseComponent(fileContent, config);
    }
    return "module.exports = " + replaceSrc(fileContent, this.query.exclude);
};

/**
 * 移除注释
 */
function removeRemark(content) {
    const reg = /<!--[\s\S]*?-->/g
    return content.replace(reg, '');
}

/**
 * 处理子组件引用
 * @param {*} content 
 * @param {*} components 
 */
function parseComponent(content, components) {
    for (let name in components) {
        let path = components[name];
        path = path.replace(/index$/, 'server.html');
        if (path.indexOf('.') != 0) {
            path = path;
        }
        const regStr = `(<${name})([\\s\\S]*?>)([\\s\\S]*?)(<\/${name}>)`;
        const reg = new RegExp(regStr, 'g');
        content = content.replace(reg, "<template  __comp__='" + name + "'  $2\"+require(" + JSON.stringify("server-template-vser-loader!" + path) + ") +\" $3 </template>");
    }
    return content;
}


/**
 * 检测文件是否存在
 * @param {string} file 文件路径
 */
function checkFileExist(file) {
    return Fs.existsSync(file);
}


/**
 * 读取文件内容
 * @param {string} file 文件路径 
 */
function readFile(file) {
    return Fs.readFileSync(file, "utf-8");
}

/**
 * 处理引用的静态资源
 * @param {*} fileContent 
 * @param {*} exclude 
 */
function replaceSrc(fileContent, exclude) {
    fileContent = fileContent.replace(/((\<img[^\<\>]*? src)|(\<link[^\<\>]*? href))=\\?[\"\']?[^\'\"\<\>\+]+?\\?[\'\"][^\<\>]*?\>/ig, function (str) {
        var reg = /((src)|(href))=\\?[\'\"][^\"\']+\\?[\'\"]/i;
        var regResult = reg.exec(str);
        if (!regResult) return str;
        var attrName = /\w+=/.exec(regResult[0])[0].replace('=', '');
        var imgUrl = regResult[0].replace(attrName + '=', '').replace(/[\\\'\"]/g, '');
        if (!imgUrl) return str; // 避免空src引起编译失败
        if (/^(http(s?):)?\/\//.test(imgUrl)) return str; // 绝对路径的图片不处理
        if (!/\.(jpg|jpeg|png|gif|svg|webp)/i.test(imgUrl)) return str; // 非静态图片不处理
        if (exclude && imgUrl.indexOf(exclude) != -1) return str; // 不处理被排除的
        if (/^\/static/.test(imgUrl)) return str; //static 开头的静态资源不处理

        if (!(/^[\.\/]/).test(imgUrl)) {
            imgUrl = './' + imgUrl;
        }
        return str.replace(reg, attrName + "=\"+JSON.stringify(require(" + JSON.stringify(imgUrl) + "))+\"");
    });
    return fileContent;
}