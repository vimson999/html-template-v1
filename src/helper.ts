// src/helper.ts
import { bitable, ITable, IRecordValue, IFieldMeta, FieldType, ToastType, IFieldConfig, ICell } from '@lark-base-open/js-sdk'; //
import { 
  CommentSchema, 
  KeyWordSearchAuthorInfo,
  KeyWordSearchApiDataItem,
  AuthorBasicAPISchema,
  AuthorBasicFormatted,
  VideoBasicApiData,
  VideoBasicFormatted,
  KOLPostsInput,
  KOLPostsFormatted,
  KeyWordSearchFeishuFormattedItem } from './schema'; //
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


export function convertFromSeachKWToFeishuFormat(originDataList: KeyWordSearchApiDataItem[]): KeyWordSearchFeishuFormattedItem[] {
  if (!Array.isArray(originDataList)) {
    console.warn('[convertToFeishuFormat] 输入的不是一个数组, 返回空数组');
    return [];
  }

  // Helper function to safely get nested properties
  // 使用泛型使 defaultValue 和返回值类型更准确
  const getSafe = <TValue, TDefault>(
    fn: () => TValue | undefined | null, // 函数可能返回目标值、undefined或null
    defaultValue: TDefault
  ): TValue | TDefault => {
    try {
      const value = fn();
      return (value === undefined || value === null) ? defaultValue : value;
    } catch (e) {
      // 如果 fn() 本身抛出错误 (例如访问null对象的属性)
      return defaultValue;
    }
  };

  // Helper function to format datetime input
  const formatPublishTime = (timeInput: string | number | null | undefined): string => {
    if (timeInput === null || timeInput === undefined || timeInput === '') {
      return '';
    }
    try {
      const date = new Date(timeInput);
      if (isNaN(date.getTime())) {
        console.warn(`[formatPublishTime] 根据输入创建的日期无效: ${timeInput}`);
        return String(timeInput); // 返回原始输入的字符串形式
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error(`[formatPublishTime] 解析日期输入时出错: ${timeInput}`, error);
      return String(timeInput); // 出错时返回原始输入的字符串形式
    }
  };

  return originDataList.map((item: KeyWordSearchApiDataItem): KeyWordSearchFeishuFormattedItem => {
    // Handle potentially problematic video_url
    // getSafe的第一个参数是函数，所以是 item.video_url 而不是 ()=>item.video_url
    // 但为了保持一致性，fn参数应该总是函数
    let contentUrlInput = getSafe(() => item.video_url, ''); // defaultValue is string
    let contentUrl: string = ''; // Ensure contentUrl is always string

    if (typeof contentUrlInput === 'string') {
        contentUrl = contentUrlInput; // Assign if it's already a string
        if (contentUrlInput.startsWith("['") && contentUrlInput.endsWith("']")) {
            try {
                const parsedArray = JSON.parse(contentUrlInput.replace(/'/g, '"'));
                if (Array.isArray(parsedArray) && parsedArray.length > 0 && typeof parsedArray[0] === 'string') {
                    contentUrl = parsedArray[0];
                }
            } catch (e) {
                console.warn(`[convertToFeishuFormat] 解析 video_url 字符串列表失败: ${contentUrlInput}`, e);
                // contentUrl 保持为原始的 contentUrlInput 字符串
            }
        }
    } else if (Array.isArray(contentUrlInput) && contentUrlInput.length > 0 && typeof contentUrlInput[0] === 'string') {
        contentUrl = contentUrlInput[0]; // 如果已经是数组，取第一个字符串元素
    } else if (contentUrlInput !== null && contentUrlInput !== undefined) {
        contentUrl = String(contentUrlInput); // Fallback to string conversion
    }


    return {
      "标题": getSafe(() => item.title, ''), // defaultValue for string fields
      "描述": getSafe(() => item.description, ''),
      "平台": getSafe(() => item.platform, ''),
      "发布时间": formatPublishTime(getSafe(() => item.publish_time, null)), // Pass null as default if prefer formatPublishTime to handle it
      "播放数": getSafe(() => item.play_count, 0),  
      "点赞数": getSafe(() => item.like_count, 0),       // defaultValue for number fields
      "评论数": getSafe(() => item.comment_count, 0),
      "分享数": getSafe(() => item.share_count, 0),
      "收藏数": getSafe(() => item.collect_count, 0),
      "作者昵称": getSafe(() => item.author?.nickname, ''),
      "作者主页": getSafe(() => item.author?.url, ''),
      "作品链接": getSafe(() => item.video_platform_url, ''),
      "封面图片链接": getSafe(() => item.cover_url, ''),
      "内容链接": contentUrl,
      "标签": getSafe(() => item.tags, ''),
      "时长(秒)": getSafe(() => item.duration, 0),
      "采集成本": getSafe(() => item.point_cost, 0)
    };
  });
}

export function convertKOLPostData(searchNotes: KOLPostsInput[]): KOLPostsFormatted[] {
  if (!searchNotes || searchNotes.length === 0) {
    return [];
  }

  return searchNotes.map(note => {
    let formattedCreateTime: string | null = null;
    if (note.create_time) {
      try {
        const date = new Date(note.create_time);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        formattedCreateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (e) {
        formattedCreateTime = note.create_time;
      }
    }

    const imageUrlsString = note.image_urls && note.image_urls.length > 0
      ? note.image_urls.join('\n')
      : null;

    const feishuRow: KOLPostsFormatted = {
      '标题': note.title,
      '作者昵称': note.author_nickname,
      '发布时间': formattedCreateTime,
      '点赞数': note.like_count,
      '评论数': note.comment_count,
      '收藏数': note.collect_count,
      '分享数': note.share_count,
      '作品ID': note.note_id,
      '类型': note.media_type, // 注意这里需要与 SearchNoteDataInput 的 media_type 对应
      '平台': note.platform,
      '作者ID': note.author_id,
      '作品链接': note.post_url,
      '封面链接': note.cover_image_url,
      '视频链接': note.video_url,
      '视频时长(秒)': note.video_duration,
      '图片链接列表': imageUrlsString,
      '作者头像链接': note.author_avatar_url,
    };
    return feishuRow;
  });
}


export function convertedAuthorAPIData(origin_author: AuthorBasicAPISchema | null | undefined): AuthorBasicFormatted | null {
  if (!origin_author) {
    return null; // 如果原始数据为空，则返回 null
  }

  // 为了安全访问属性并提供默认值，可以使用如下方式：
  // (value ?? defaultValue) - 如果 value 是 null 或 undefined，则使用 defaultValue

  return {
    "平台": origin_author.platform ?? '',
    "作者昵称": origin_author.nickname ?? '',
    "个性签名": origin_author.bio_signature ?? '',
    "粉丝数": origin_author.follower_count ?? 0,
    "关注数": origin_author.following_count ?? 0,
    "总互动量": origin_author.total_engagement ?? 0,
    "作品数": origin_author.post_count ?? 0,
    "IP属地": origin_author.ip_location ?? '',
    "平台用户ID": origin_author.user_id_platform ?? '',
    "头像链接": origin_author.avatar_url ?? '',   
    "作者主页": origin_author.original_url ?? '', // API返回的是 original_url
  };
}


export async function fillDataTable(
  table: ITable,
  dataToFill: any[] | undefined,
  wasTableDynamicallyCreated: boolean // 这个参数在 ICell[][] 方式下可能不那么直接相关，但保留以了解数据来源
) { //
  const ui = bitable.ui; //

  if (!table) { //
    console.error('[fillDataTable] 无效的表格对象。'); //
    await ui.showToast({ toastType: ToastType.error, message: '无效表格对象，无法填充' }); //
    return; //
  }
  if (!dataToFill || !Array.isArray(dataToFill) || dataToFill.length === 0) { //
    console.warn('[fillDataTable] 没有数据可供填充。'); //
    await ui.showToast({ toastType: ToastType.info, message: '没有数据可供填充' });
    return; //
  }

  if (typeof dataToFill[0] !== 'object' || dataToFill[0] === null) { //
    console.warn('[fillDataTable] 数据格式不正确或为空数组（首项非对象）。'); //
    await ui.showToast({ toastType: ToastType.warning, message: '待填充数据格式不正确' }); //
    return; //
  }

  const recordsAsCells: ICell[][] = []; // 用于存储最终的 ICell[][]
  
  try {
    // 1. 获取表格的字段列表，以便按名称查找字段对象
    // 如果是动态创建的表，字段名就是 API 的 key；如果是现有表，字段名是用户定义的。
    const fieldMetaList = await table.getFieldMetaList(); //
    const fieldMapByName = new Map<string, IFieldMeta>();
    fieldMetaList.forEach(meta => fieldMapByName.set(meta.name, meta));

    const firstItemKeys = Object.keys(dataToFill[0]); // API 数据中的键（可能作为字段名）

    for (const item of dataToFill) { //
      if (typeof item !== 'object' || item === null) continue; //

      const recordCells: ICell[] = []; // 存储单条记录的 ICell 对象

      for (const apiKey of firstItemKeys) { //
        if (!Object.prototype.hasOwnProperty.call(item, apiKey)) continue; //

        const rawValue = item[apiKey]; //
        
        // 通过 apiKey (作为字段名) 查找对应的 Field 对象
        const fieldMeta = fieldMapByName.get(apiKey);
        
        if (fieldMeta) {
          try {
            const field = await table.getFieldById(fieldMeta.id);
            // 对 rawValue 进行类型转换以匹配字段类型，field.createCell 会处理大部分情况
            // 但对于 DateTime，SDK 通常期望时间戳
            let valueToCreateCellWith = rawValue;
            if (fieldMeta.type === FieldType.DateTime && rawValue !== null && rawValue !== undefined) { //
              const timestamp = new Date(rawValue).getTime(); //
              if (!isNaN(timestamp)) { //
                valueToCreateCellWith = timestamp; //
              } else {
                console.warn(`[fillDataTable] 值 "${rawValue}" 无法转换为字段 "${apiKey}" 的有效时间戳。将尝试使用原始值。`);
                // valueToCreateCellWith = null; // 或者不创建这个cell
              }
            } else if (fieldMeta.type === FieldType.Checkbox && rawValue !== null && rawValue !== undefined ) { //
                 valueToCreateCellWith = Boolean(rawValue && String(rawValue).toLowerCase() !== 'false' && String(rawValue) !== '0'); //
            } else if ((fieldMeta.type === FieldType.Number) && rawValue !== null && rawValue !== undefined ) { //
                const num = parseFloat(String(rawValue)); //
                valueToCreateCellWith = isNaN(num) ? null : num; //
            } else if (typeof rawValue === 'object' && rawValue !== null && fieldMeta.type === FieldType.Text) { //
                // 如果字段是文本类型，但原始值是对象/数组，序列化为JSON字符串
                try {
                    valueToCreateCellWith = JSON.stringify(rawValue); //
                } catch (e) {
                    valueToCreateCellWith = String(rawValue); //
                }
            }


            if (valueToCreateCellWith !== null && valueToCreateCellWith !== undefined) { // 避免为 null 或 undefined 创建单元格，除非字段允许
                const cell = await field.createCell(valueToCreateCellWith);
                recordCells.push(cell);
            } else if (rawValue === null || rawValue === undefined) { // 如果原始值就是 null/undefined，也创建一个表示空值的单元格
                const cell = await field.createCell(null); // 或者 undefined，取决于字段类型如何处理
                recordCells.push(cell);
            }
          } catch (fieldError) {
            console.error(`[fillDataTable] 处理字段 "${apiKey}" (ID: ${fieldMeta.id}) 时出错: `, fieldError);
            // 可选择跳过此字段或整条记录
          }
        } else {
          // console.warn(`[fillDataTable] 在表格中未找到名为 "${apiKey}" 的字段，将跳过此数据项。`);
        }
      }

      if (recordCells.length > 0) { //
        recordsAsCells.push(recordCells);
      }
    }
  } catch (error) {
    console.error('[fillDataTable] 准备待添加记录时出错: ', error);
    await ui.showToast({ toastType: ToastType.error, message: `数据准备失败: ${(error as Error).message.substring(0,100)}`});
    return;
  }


  if (recordsAsCells.length > 0) { //
    try { //
      const BATCH_SIZE = 500; // SDK 建议的批量大小，但实际限制可能不同，通常不超过5000
      for (let i = 0; i < recordsAsCells.length; i += BATCH_SIZE) { //
        const chunk = recordsAsCells.slice(i, i + BATCH_SIZE); //
        await table.addRecords(chunk); // 使用 ICell[][] 的重载
      }
      const tableName = await table.getName(); //
      await ui.showToast({ toastType: ToastType.success, message: `成功向 "${tableName}" 添加 ${recordsAsCells.length} 条记录` }); //
    } catch (error) { //
      const tableName = await table.getName(); //
      console.error(`[fillDataTable] 向表格 "${tableName}" 添加记录失败:`, error); //
      await ui.showToast({ toastType: ToastType.error, message: `向 "${tableName}" 添加记录失败: ${(error as Error).message.substring(0,100)}` }); //
    }
  } else { //
    console.warn('[fillDataTable] 没有可添加到表格的记录 (可能所有字段都不匹配或源数据为空)。'); //
    await ui.showToast({ toastType: ToastType.info, message: '没有可写入表格的有效数据。' });
  }
}



const formatVideoBasicPublishTime = (timeInput: string | number | null | undefined): string => {
  if (timeInput === null || timeInput === undefined || timeInput === '') {
    return '';
  }
  try {
    const date = new Date(timeInput);
    if (isNaN(date.getTime())) {
      console.warn(`[formatVideoBasicPublishTime] 根据输入创建的日期无效: ${timeInput}`);
      return String(timeInput); // 返回原始输入的字符串形式
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error(`[formatVideoBasicPublishTime] 解析日期输入时出错: ${timeInput}`, error);
    return String(timeInput); // 出错时返回原始输入的字符串形式
  }
};

// 3. 转换函数：将 VideoBasicApiData 转换为 VideoBasicFormatted
export function convertVideoBasicToFeishuFormat(data: VideoBasicApiData): VideoBasicFormatted {
  return {
    "标题": data.title,
    "作者": data.authorName,
    "描述": data.description,
    "发布时间": formatVideoBasicPublishTime(data.publishTime),
    "点赞数": data.likeCount,
    "收藏数": data.collectCount,
    "分享数": data.shareCount,
    "评论数": data.commentCount,
    "标签": data.tags,
    "封面链接": data.coverUrl,
    "视频链接": data.videoUrl,
    "文案内容": data.content,
  };
}