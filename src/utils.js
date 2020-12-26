import { resolve, basename } from 'path'
import fse from 'fs-extra'
import fetch from 'node-fetch'

async function downloadConfig() {
  const fp_version = './dest/cfg_version.json'

  // 版本控制文件
  const versionData = fse.existsSync(fp_version) ? await fse.readJSON(fp_version) : {}

  const response = await fetch("http://192.168.1.116:8888/gateway/?e=0", {
    "body": "{\"id\":\"101\",\"lan\":\"cn\",\"pf\":\"developer\",\"method\":\"sys.new_get_config\",\"params\":{\"pf\":\"developer\",\"lan\":\"cn\"},\"cfg_version\":0,\"app_version\":\"v_1_1_0\",\"phone_id\":[\"web\",\"\"],\"app_id\":\"web\"}",
    "method": "POST"
  })
  const { data: { config_dict } } = await response.json()
  delete config_dict.color // 排除color配置
  for (const key in config_dict) {
    const url = config_dict[key]
    const fp = `./dest/configs/${key}.json`
    if (fse.existsSync(fp) && versionData[key] === url) continue
    console.log(`download ${key}.json`)
    await fse.ensureFile(fp)
    await fse.writeFile(fp, await (await fetch(url)).text())
    versionData[key] = url
  }
  await fse.writeJSON(fp_version, versionData) // 保存版本控制文件
}

/**
 * 合并对象
 */
function mergeObjects (list) {
  const result = {}
  list.forEach(obj => {
    for (const key in obj) {
      if (isNaN(obj[key])) {
        result[key] = obj[key]
      } else {
        result[key] = (result[key] || 0) + obj[key]
      }
    }
  })
  return result
}

/**
 * 获取指定路径下所有文件的URL
 */
async function getFiles(fp, excludes) {
  if (fse.statSync(fp).isFile()) {
    return [fp]
  }
  const files = await fse.readdir(fp)
  const list = await Promise.all(files.map(file => getFiles(resolve(fp, file))))
  excludes = [excludes].flat()
  return list.flat().filter(url => !excludes.some(str => url.startsWith(str)))
}

function formatColor (hex) {
  hex = hex.toLowerCase().replace(/['|"]/g, '')
  if (/#[\d|a-f]{6}/.test(hex)) {
    return hex
  } else if (/#[\d|a-f]{3}/.test(hex)) {
    const [, a, b, c] = hex
    return '#' + [a, a, b, b, c, c].join('')
  } 
  return '#000000'
}

/**
 * 获取路径下所有文件中使用的颜色 排除 '#ffffff' '#000000'
 */
async function getColors(fp, excludes) {
  const result = {}
  const files = await getFiles(fp, excludes)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const content = await fse.readFile(file, 'utf8')
    const  reg = /#[\d|a-f]{3,6}\b/igm
    const colors = content.match(reg)
    if (colors) {
      const colorObj = {}
      const fn = basename(file)
      colors.forEach(hex => {
        hex = formatColor(hex)
        if (!['#ffffff', '#000000'].includes(hex)) {
          colorObj[hex] = (colorObj[hex] || 0) + 1
        }
      })
      result[fn] = colorObj
    }
  }
  return result
}

export {
  downloadConfig,
  getColors,
  mergeObjects,
}
