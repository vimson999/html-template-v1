// src/helper.ts
import { bitable, ITable, IFieldConfig, FieldType, ToastType } from '@lark-base-open/js-sdk'; //
import { CommentSchema } from './schema'; //
// 您在 helper.ts 中使用了 $，但没有导入。如果确实需要 jQuery，请取消下面的注释
// import $ from 'jquery';

// FormValues 接口定义 (从您的 helper.ts 移至此处或一个单独的 types.ts 文件更佳)
export interface FormValues { //
    inputValue: string;
    intentSelect: string;
    radioCreate: boolean;
    radioSelect: boolean;
    tableSelect: string; 
    apiKey: string;
}

export function inferFieldTypeFromValue(value: any): FieldType { //
  const jsType = typeof value;
  if (jsType === 'string') {
    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(value)) {
      return FieldType.Url; //
    }
    if (value.length >= 10 && (value.includes('-') || value.includes('/') || value.toUpperCase().includes('T')) && !isNaN(new Date(value).getTime())) {
      // return FieldType.DateTime; //
    }
    return FieldType.Text; //
  }
  if (jsType === 'number') {
    return FieldType.Number; //
  }
  if (jsType === 'boolean') {
    return FieldType.Checkbox; //
  }
  if (jsType === 'object' && value !== null) {
    return FieldType.Text; //
  }
  return FieldType.Text; //
}

export async function getTable(
  inputValues: { tableOption: string, tableSelect?: string, intentSelect: string },
  desiredTableNamePrefix: string,
  platform: string | undefined,
  apiResultDataForSchema?: any[] | object
): Promise<ITable | null> { //
  const ui = bitable.ui; // 获取 ui 对象

  if (inputValues.tableOption === 'create') { //
    if (!apiResultDataForSchema || (Array.isArray(apiResultDataForSchema) && apiResultDataForSchema.length === 0)) { //
        console.warn('[getTable] 新建表格模式：未提供用于推断表结构的数据。'); //
        await ui.showToast({ toastType: ToastType.warning, message: '无数据用于推断新表结构' }); //
        return null;
    }

    const sampleItem = Array.isArray(apiResultDataForSchema) ? apiResultDataForSchema[0] : apiResultDataForSchema; //

    if (typeof sampleItem !== 'object' || sampleItem === null) { //
        console.error('[getTable] 新建表格模式：用于推断表结构的数据样本不是有效对象。'); //
        await ui.showToast({ toastType: ToastType.error, message: '数据样本无效，无法创建表格' }); //
        return null;
    }
    
    const fieldConfigList: IFieldConfig[] = []; //

    for (const key in sampleItem) { //
      if (Object.prototype.hasOwnProperty.call(sampleItem, key)) { //
        const specificFieldType = inferFieldTypeFromValue(sampleItem[key]); //
        
        let configItem: IFieldConfig;

        switch (specificFieldType) { //
            case FieldType.Text:
                configItem = { name: key, type: FieldType.Text, property: undefined };
                break;
            case FieldType.Number:
                configItem = { name: key, type: FieldType.Number, property: undefined };
                break;
            case FieldType.Url:
                configItem = { name: key, type: FieldType.Url, property: undefined };
                break;
            case FieldType.DateTime:
                configItem = { name: key, type: FieldType.DateTime, property: undefined };
                break;
            case FieldType.Checkbox:
                configItem = { name: key, type: FieldType.Checkbox, property: undefined };
                break;
            default:
                console.warn(`[getTable] Unexpected specificFieldType: ${specificFieldType} for key: ${key}. Defaulting to Text.`);
                configItem = { name: key, type: FieldType.Text, property: undefined };
                break;
        }
        fieldConfigList.push(configItem); //
      }
    }

    if (fieldConfigList.length === 0) { //
        console.warn('[getTable] 未能从数据中分析出任何字段用于新表。'); //
        await ui.showToast({ toastType: ToastType.warning, message: '无法确定新表格的字段' }); //
        return null;
    }

    const timeSuffix = await getSheetName(); // 调用修改后的 getSheetName 获取 时分秒 后缀
    const prefixPart = desiredTableNamePrefix ? `${desiredTableNamePrefix}_` : ""; // 如果前缀不为空，则添加下划线
    const uniqueTableName = `${prefixPart}${inputValues.intentSelect}_${timeSuffix}`; 
    try { //
        const { tableId } = await bitable.base.addTable({ //
            name: uniqueTableName, //
            fields: fieldConfigList, //
        });
        await ui.showToast({ toastType: ToastType.success, message: `表格 "${uniqueTableName}" 已创建` }); //
        return await bitable.base.getTableById(tableId); //
    } catch (error) { //
        console.error(`[getTable] 创建表格 "${uniqueTableName}" 失败:`, error); //
        await ui.showToast({ toastType: ToastType.error, message: `创建表格失败: ${(error as Error).message}` }); //
        return null;
    }

  } else if (inputValues.tableOption === 'select') { //
    const selectedTableId = inputValues.tableSelect; //
    if (!selectedTableId) { //
      await ui.showToast({ toastType: ToastType.warning, message: '未选择任何现有表格' }); //
      return null;
    }
    try { //
      const table = await bitable.base.getTableById(selectedTableId); //
      return table; //
    } catch (error) { //
      console.error(`[getTable] 获取所选表格 (ID: ${selectedTableId}) 失败:`, error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取所选表格失败: ${(error as Error).message}` }); //
      return null;
    }
  } else { //
    await ui.showToast({ toastType: ToastType.error, message: '无效的表格操作选项' }); //
    return null;
  }
}

// 保持您 helper.ts 中的其他函数，例如:
// getTable_1, getDefaultFields, getSheetName, getFormValuesAndValidate,
// getCleanUrl, convertDYComment, convertXHSComment, identifyPlatform, MediaPlatform 枚举等。
// 确保这些函数如果内部使用了 bitable.ui.showToast, 也会先获取 bitable.ui 对象。
// 例如 getFormValuesAndValidate 使用了 alert，可以保持原样或按需修改。

export function getFormValuesAndValidate(): FormValues | null { //
    const inputValueElement = document.getElementById('inputValue') as HTMLInputElement | null; //
    const inputValue = inputValueElement ? inputValueElement.value.trim() : ""; 

    const intentSelectElement = document.getElementById('intentSelect') as HTMLSelectElement | null; //
    const intentSelect = intentSelectElement ? intentSelectElement.value : ""; 

    const radioCreateElement = document.getElementById('radioCreate') as HTMLInputElement | null; //
    const radioCreate = radioCreateElement ? radioCreateElement.checked : false; 

    const radioSelectElement = document.getElementById('radioSelect') as HTMLInputElement | null; //
    const radioSelect = radioSelectElement ? radioSelectElement.checked : false; 

    const tableSelectElement = document.getElementById('tableSelect') as HTMLSelectElement | null; //
    const tableSelect = tableSelectElement ? tableSelectElement.value : ""; 

    const apiKeyElement = document.getElementById('apiKey') as HTMLInputElement | null; //
    const apiKey = apiKeyElement ? apiKeyElement.value.trim() : ""; 

    if (!inputValue) { //
      alert('请输入地址内容'); //
      return null; //
    }
    if (!intentSelect) { //
      alert('请选择获取的数据'); //
      return null; //
    }
    if (!radioCreate && !radioSelect) { //
      alert('请选择表格操作方式'); //
      return null; //
    }
    if (radioSelect && !tableSelect) { //
      alert('请选择已有表格'); //
      return null; //
    }
    if (!apiKey) { //
      alert('请输入API Key'); //
      return null; //
    }
    return { inputValue, intentSelect, radioCreate, radioSelect, tableSelect, apiKey }; //
}

export function getCleanUrl(text: string | null | undefined): string | null { //
  try { //
    if (!text) { //
      console.warn("收到空的URL文本"); //
      return null; //
    }
    const urlRegex = /https?:\/\/(?:[-\w.]|[?=&/%#])+/g; //
    const matches = String(text).match(urlRegex); //
    if (!matches || matches.length === 0) { //
      console.warn(`未找到有效的URL: ${text}`); //
      return null; //
    }
    let url = matches[0].trim(); //
    url = url.replace(/[<>"{}|\\'^`]/g, ""); //
    if (!(url.startsWith("http://") || url.startsWith("https://"))) { //
      console.warn(`URL协议不支持: ${url}`); //
      return null; //
    }
    return url; //
  } catch (e) { //
    console.error(`URL提取失败: ${(e as Error).message}`, e); //
    return null; //
  }
}

export function convertDYComment(origin_commentsList: any[]): CommentSchema[] { // 修改了签名，移除了 commentDataList 参数 //
  let commentDataListInternal = origin_commentsList.map(originalComment => { //
    let userProfileUrl = ''; //
    if (originalComment.sec_uid) { //
      userProfileUrl = `https://www.douyin.com/user/${originalComment.sec_uid}`; //
    }

    let diggCountString = "0";
    if (originalComment.digg_count !== null && originalComment.digg_count !== undefined) {
        const count = Number(originalComment.digg_count);
        diggCountString = count < 0 ? "0" : String(count);
    }

    return { //
      nick_name: originalComment.nickname, //
      create_time: originalComment.create_time, //
      text: originalComment.text, //
      digg_count: diggCountString, //
      ip_label: originalComment.ip_label, //
      user_id: originalComment.uid, //
      user_url: userProfileUrl //
    } as CommentSchema; // 断言为 CommentSchema
  });

  commentDataListInternal.sort((a: CommentSchema, b: CommentSchema) => { //
    const diggA = parseInt(a.digg_count, 10) || 0; //
    const diggB = parseInt(b.digg_count, 10) || 0; //
    return diggB - diggA; //
  });

  return commentDataListInternal; //
}


export function convertXHSComment(origin_commentsList: any[]): CommentSchema[] { //
  const convertedList: CommentSchema[] = [];

  if (!Array.isArray(origin_commentsList)) {
    console.warn('[convertXHSComment] origin_commentsList 不是一个有效的数组');
    return convertedList;
  }

  origin_commentsList.forEach(originalComment => {
    // 确保 originalComment 和 originalComment.user_info 存在且是对象
    if (typeof originalComment !== 'object' || originalComment === null || 
        typeof originalComment.user_info !== 'object' || originalComment.user_info === null) {
      console.warn('[convertXHSComment] 无效的评论项或用户信息:', originalComment);
      return; // 跳过这条无效的评论
    }

    const userInfo = originalComment.user_info;
    let userProfileUrl = '';
    if (userInfo.user_id) { //.user_info.user_id]
      userProfileUrl = `https://www.xiaohongshu.com/user/profile/${userInfo.user_id}`;
    }

    // 处理点赞数，确保小于0时为0
    let diggCountString = "0";
    if (originalComment.like_count !== null && originalComment.like_count !== undefined) { //.like_count]
        const count = Number(originalComment.like_count);
        diggCountString = count < 0 ? "0" : String(count);
    }
    
    // create_time 已经是毫秒时间戳，可以直接使用，或根据 CommentSchema 转换为字符串
    // 如果 CommentSchema.create_time 需要字符串，可以在这里格式化：
    const createTimeFormatted = new Date(originalComment.create_time).toLocaleString(); // 示例格式化

    convertedList.push({
      nick_name: userInfo.nickname || "未知用户", //.user_info.nickname]
      create_time: createTimeFormatted, // 直接使用时间戳，如果 CommentSchema.create_time 是 number //.create_time]
                                               // 或者 createTimeFormatted 如果是字符串
      text: originalComment.content || "", //.content]
      digg_count: diggCountString,
      ip_label: originalComment.ip_location || "未知地点", //.ip_location]
      user_id: userInfo.user_id || "未知ID", //.user_info.user_id]
      user_url: userProfileUrl
    });

    // 如果需要处理子评论 (sub_comments)，可以在这里添加逻辑
    // 例如，递归调用或将子评论也转换为 CommentSchema 并添加到 convertedList
    if (Array.isArray(originalComment.sub_comments) && originalComment.sub_comments.length > 0) { //.sub_comments]
        originalComment.sub_comments.forEach((subComment: any) => {
            if (typeof subComment !== 'object' || subComment === null ||
                typeof subComment.user_info !== 'object' || subComment.user_info === null) {
                console.warn('[convertXHSComment] 无效的子评论项或用户信息:', subComment);
                return; 
            }
            const subUserInfo = subComment.user_info;
            let subUserProfileUrl = '';
            if (subUserInfo.user_id) { //.sub_comments[0].user_info.user_id]
                subUserProfileUrl = `https://www.xiaohongshu.com/user/profile/${subUserInfo.user_id}`;
            }

            let subDiggCountString = "0";
            if (subComment.like_count !== null && subComment.like_count !== undefined) { //.sub_comments[0].like_count]
                const subCount = Number(subComment.like_count);
                subDiggCountString = subCount < 0 ? "0" : String(subCount);
            }

            const createTimeFormatted = new Date(subComment.create_time).toLocaleString(); // 示例格式化
            convertedList.push({
                nick_name: subUserInfo.nickname || "未知用户", //.sub_comments[0].user_info.nickname]
                // create_time: subComment.create_time, //.sub_comments[0].create_time]
                create_time: createTimeFormatted,
                text: `回复 @${originalComment.user_info.nickname}: ${subComment.content || ""}`, // 添加 "回复@" 前缀 //.sub_comments[0].content]
                digg_count: subDiggCountString,
                ip_label: subComment.ip_location || "未知地点", //.sub_comments[0].ip_location]
                user_id: subUserInfo.user_id || "未知ID", //.sub_comments[0].user_info.user_id]
                user_url: subUserProfileUrl
            });
        });
    }
  });

  // 按点赞数倒序排序 (如果需要，已在您的 convertDYComment 中存在)
  convertedList.sort((a: CommentSchema, b: CommentSchema) => {
    const diggA = parseInt(a.digg_count, 10) || 0;
    const diggB = parseInt(b.digg_count, 10) || 0;
    return diggB - diggA;
  });
  
  return convertedList;
}

export enum MediaPlatform { //
  DOUYIN = "douyin", //
  XIAOHONGSHU = "xiaohongshu", //
  BILIBILI = "bilibili", //
  YOUTUBE = "youtube", //
  INSTAGRAM = "instagram", //
  TIKTOK = "tiktok", //
  KUAISHOU = "kuaishou", //
  UNKNOWN = "unknown" //
}

export function identifyPlatform(url: string): MediaPlatform { //
  if (!url) { //
    return MediaPlatform.UNKNOWN; //
  }

  const lowercasedUrl = url.toLowerCase(); //

  const douyinDomains: string[] = ["douyin.com", "iesdouyin.com"]; //
  if (douyinDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.DOUYIN; //
  }

  const xiaohongshuDomains: string[] = ["xiaohongshu.com", "xhslink.com", "xhs.cn"]; //
  if (xiaohongshuDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.XIAOHONGSHU; //
  }

  const bilibiliDomains: string[] = ["bilibili.com", "bilibili.cn"]; //
  if (bilibiliDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.BILIBILI; //
  }
  
  const youtubeSpecificFragments: string[] = [ //
    "youtu.be",  //
    "youtube.com" //
  ];
  if (youtubeSpecificFragments.some(fragment => lowercasedUrl.includes(fragment))) { //
    return MediaPlatform.YOUTUBE; //
  }

  const instagramDomains: string[] = ["instagram.com"]; //
  if (instagramDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.INSTAGRAM; //
  }

  const tiktokDomains: string[] = ["tiktok.com"]; //
  if (tiktokDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.TIKTOK; //
  }

  const kuaishouDomains: string[] = ["kuaishou.com"]; //
  if (kuaishouDomains.some(domain => lowercasedUrl.includes(domain))) { //
    return MediaPlatform.KUAISHOU; //
  }
  
  return MediaPlatform.UNKNOWN; //
}

// getDefaultFields 返回的是 FieldType 数字枚举，与 SDK 的 FieldType 字符串/数字枚举可能不直接兼容
// 需要确保这些数字与 JS SDK 中 FieldType 的实际值对应，或者进行转换
// 例如，JS SDK 中 FieldType.Text 可能不是数字 1。
// 鉴于之前的类型错误，直接使用数字作为 type 是有风险的。
// 建议 getDefaultFields 直接返回符合 IFieldConfig 中 type 期望的 FieldType 枚举成员。
// 为保持您原有结构，我对 getTable_1 做了最小调整并加了类型断言，但这部分需要您仔细核对 FieldType 的实际值。
export function getDefaultFields(platform: MediaPlatform,intentSelect: string): {name: string, type: number}[] { //
    let fields = [ //
      { name: "a", type: 1 }, //
      { name: "b", type: 1 }, //
      { name: "c", type: 1 } //
    ];
    // 您原来的 switch 逻辑被注释掉了，如果需要启用，请确保 type 的值与 JS SDK 的 FieldType 兼容
    return fields; //
}

export async function getSheetName() { //
  const now = new Date(); //
  const year = now.getFullYear(); //
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); //
  const day = now.getDate().toString().padStart(2, '0'); //
  const hours = now.getHours().toString().padStart(2, '0'); //
  const minutes = now.getMinutes().toString().padStart(2, '0'); //
  const seconds = now.getSeconds().toString().padStart(2, '0'); //
  // 修改 getSheetName 返回更简洁的时分秒或您需要的格式
  // return `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`; // 您原来的格式
  return `${hours}点${minutes}分${seconds}`; // 返回 时分秒，例如 "143055"
}