const Fs = require('fs');

/**
 * 解析引用关系
 * @param {*} content 
 */
function parseImport(content) {
    // 示例:
    // import Second from '../second/index';
    // import Third from '../third/index';
    // import Four from '../four/index';
    // import Page from 'components/page/index';
    // import Header from 'components/header/index';
    // import Footer from 'components/footer/index';
    let data = {};
    const regImport = /import\s*(\S*)\s*from\s*['"](\S*)['"]/g;
    const regItem = /^import\s*(\S*)\s*from\s*['"](\S*)['"]/;
    const result = content.match(regImport) || [];
    result.forEach(function (item) {
        const _result = item.match(regItem);
        if (_result && _result.length && _result.length === 3) {
            data[_result[1]] = _result[2];
        }
    });
    return data;
}

/**
 * 解析组件定义
 * @param {*} content 
 */
function parseComponent(content) {
    // 示例:
    // export default {
    //     yyy: '222',
    //     ddd: {
    //         ddd: 23
    //     },
    //     components: {
    //         Page,
    //         Header,
    //         Footer,
    //         Second: Second,
    //         Third,
    //         Four
    //     },
    //     xxx: {
    //         1: 2,
    //         12: 34
    //     }
    // }
    let data = {};
    const regComponents = /export\s*default[\s\S]*components:\s*{([\s\S]*?)}/;
    const result = content.match(regComponents);
    if (!result || result.length < 2) return null;

    const components = result[1];
    const regType1 = /(\w+)/g;
    const regType2 = /(\w+)\s*:\s*(\w+)/g;
    const list1 = components.match(regType1);
    const list2 = components.match(regType2);
    if (list1 && list1.length) {
        list1.forEach(function (item) {
            data[item] = item;
        });
    }
    if (list2 && list2.length) {
        const regItem2 = /(\w+)\s*:\s*(\w+)/;
        list2.forEach(function (item) {
            const resultItem2 = item.match(regItem2);
            if (resultItem2 && resultItem2.length && resultItem2.length === 3) {
                data[resultItem2[1]] = resultItem2[2];
            }
        });
    }
    return data;
}

/**
 * 读取文件内容
 * @param {string} file 文件路径 
 */
function readFile(file) {
    return Fs.readFileSync(file, "utf-8");
}

/**
 * 开始解析
 * @param {*} content 
 */
function parse(content) {
    let data = {};
    // 引用关系
    const importConfig = parseImport(content);
    //组件命名
    const componentsConfig = parseComponent(content);
    for (let key in componentsConfig) {
        const val = componentsConfig[key];
        if (importConfig[val]) {
            data[key] = importConfig[val];
        }
    }
    return data;
}

module.exports = parse;