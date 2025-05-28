import $ from 'jquery';
import { AddFieldUnknownError, bitable, ITable } from '@lark-base-open/js-sdk';
import { CommentSchema } from './schema';



export async function getTable(title: string,intentSelect:string,platform: MediaPlatform) {
    const radioCreate = (document.getElementById('radioCreate') as HTMLInputElement)?.checked;
    const intentSelectElement = document.getElementById('intentSelect') as HTMLSelectElement;
    const intentSelectText = intentSelectElement ? intentSelectElement.options[intentSelectElement.selectedIndex]?.text : '';
    const title_suffix = await getSheetName();

    let table;
    if (radioCreate) {
      const tableName = `【${title}】_【${intentSelectText}】_${title_suffix}`;
      console.log('tableName is ', tableName);

      const addResult = await bitable.base.addTable({
        name: tableName,
        fields: getDefaultFields(platform,intentSelect)
      });

      table = await bitable.base.getTableById(addResult.tableId);
    } else {
      const tableId = $('#tableSelect').val();
      table = await bitable.base.getTableById(tableId as string);
    }

    return table;
  }


  export function getDefaultFields(platform: MediaPlatform,intentSelect: string) {
    let fields = [
      { name: "a", type: 1 },
      { name: "b", type: 1 },
      { name: "c", type: 1 }
    ];

    switch (intentSelect) {
      case 'get_comments':
        fields = [
          { name: "昵称", type: 1 },
          { name: "评论时间", type: 1 },
          { name: "内容", type: 1 },
          { name: "赞", type: 1 },
          { name: "所在地", type: 1 },
          { name: "地址", type: 1 },
          { name: "user_id", type: 1 }
        ];
        break;
      case 'keyword_search':
        break;
      default:
        alert('未选择获取的数据');
    }
    
    return fields;
  }


  export async function getSheetName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，所以+1，并补零
    const day = now.getDate().toString().padStart(2, '0'); // 补零
    const hours = now.getHours().toString().padStart(2, '0'); // 补零
    const minutes = now.getMinutes().toString().padStart(2, '0'); // 补零
    const seconds = now.getSeconds().toString().padStart(2, '0'); // 补零
    const randomSuffix = `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`;

    return randomSuffix;
  }


  export function getFormValuesAndValidate() : FormValues | null{
    const inputValue = (document.getElementById('inputValue') as HTMLInputElement)?.value.trim();
    const intentSelect = (document.getElementById('intentSelect') as HTMLSelectElement)?.value;
    const radioCreate = (document.getElementById('radioCreate') as HTMLInputElement)?.checked;
    const radioSelect = (document.getElementById('radioSelect') as HTMLInputElement)?.checked;
    const tableSelect = (document.getElementById('tableSelect') as HTMLSelectElement)?.value;
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value.trim();

    if (!inputValue) {
      alert('请输入地址内容');
      return null;
    }
    if (!intentSelect) {
      alert('请选择获取的数据');
      return null;
    }
    if (!radioCreate && !radioSelect) {
      alert('请选择表格操作方式');
      return null;
    }
    if (radioSelect && !tableSelect) {
      alert('请选择已有表格');
      return null;
    }
    if (!apiKey) {
      alert('请输入API Key');
      return null;
    }
    return { inputValue, intentSelect, radioCreate, radioSelect, tableSelect, apiKey };
  }


export interface FormValues {
    inputValue: string;
    intentSelect: string; // Or string | undefined if applicable
    radioCreate: boolean;
    radioSelect: boolean;
    tableSelect: string; // Or string | undefined if applicable
    apiKey: string;
  }


  // export interface CommentData {
  //   nick_name: string;
  //   create_time: string;
  //   text: string;
  //   digg_count: string;
  //   ip_label: string;
  //   uid: string;
  //   url: string;
  // }


export function getCleanUrl(text: string | null | undefined): string | null {
  try {
    if (!text) {
      console.warn("收到空的URL文本");
      return null;
    }
    const urlRegex = /https?:\/\/(?:[-\w.]|[?=&/%#])+/g;
    const matches = String(text).match(urlRegex);
    if (!matches || matches.length === 0) {
      console.warn(`未找到有效的URL: ${text}`);
      return null;
    }
    let url = matches[0].trim();
    url = url.replace(/[<>"{}|\\'^`]/g, "");
    if (!(url.startsWith("http://") || url.startsWith("https://"))) {
      console.warn(`URL协议不支持: ${url}`);
      return null;
    }
    return url;
  } catch (e) {
    console.error(`URL提取失败: ${(e as Error).message}`, e);
    return null;
  }
}



export function convertDYComment(commentDataList: any, origin_commentsList: any[]) {
  commentDataList = origin_commentsList.map(originalComment => {
    let userProfileUrl = '';
    if (originalComment.sec_uid) {
      userProfileUrl = `https://www.douyin.com/user/${originalComment.sec_uid}`;
    }

    return {
      nick_name: originalComment.nickname, // 映射 nickname
      create_time: originalComment.create_time, // 直接使用，已经是字符串
      text: originalComment.text, // 直接使用
      ip_label: originalComment.ip_label, // 直接使用
      user_id: originalComment.uid, // 直接使用 (原始数据中的 uid 已经是字符串或可以被JS安全处理)
      digg_count: String(originalComment.digg_count), // 数字转换为字符串
      user_url: userProfileUrl // 使用构造的 URL，如果无法构造则为空字符串
    };
  });

  // 添加按 digg_count 倒序排序的逻辑
  commentDataList.sort((a: CommentSchema, b: CommentSchema) => {
    const diggA = parseInt(a.digg_count, 10) || 0; // 转换为数字，如果转换失败则为0
    const diggB = parseInt(b.digg_count, 10) || 0;
    return diggB - diggA; // 倒序排序
  });

  return commentDataList;
}



export function convertXHSComment(commentDataList: any, origin_commentsList: any[]) {
  commentDataList = origin_commentsList.map(originalComment => {
    let userProfileUrl = '';
    if (originalComment.sec_uid) {
      userProfileUrl = `https://www.douyin.com/user/${originalComment.sec_uid}`;
    }

    return {
      nick_name: originalComment.nickname, // 映射 nickname
      create_time: originalComment.create_time, // 直接使用，已经是字符串
      text: originalComment.text, // 直接使用
      digg_count: String(originalComment.digg_count), // 数字转换为字符串
      ip_label: originalComment.ip_label, // 直接使用
      uid: originalComment.uid, // 直接使用 (原始数据中的 uid 已经是字符串或可以被JS安全处理)
      url: userProfileUrl // 使用构造的 URL，如果无法构造则为空字符串
    };
  });

  // 添加按 digg_count 倒序排序的逻辑
  // commentDataList.sort((a: CommentData, b: CommentData) => {
  //   const diggA = parseInt(a.digg_count, 10) || 0; // 转换为数字，如果转换失败则为0
  //   const diggB = parseInt(b.digg_count, 10) || 0;
  //   return diggB - diggA; // 倒序排序
  // });
  
  return commentDataList;
}



/**
 * 定义媒体平台类型的枚举
 */
export enum MediaPlatform {
  DOUYIN = "douyin",
  XIAOHONGSHU = "xiaohongshu",
  BILIBILI = "bilibili",
  YOUTUBE = "youtube",
  INSTAGRAM = "instagram",
  TIKTOK = "tiktok",
  KUAISHOU = "kuaishou",
  UNKNOWN = "unknown"
}

/**
 * 识别 URL 对应的媒体平台
 * * @param url 媒体 URL 字符串
 * @returns 返回平台标识 (MediaPlatform 枚举成员)
 */
export function identifyPlatform(url: string): MediaPlatform {
  if (!url) { // 处理空或未定义的 URL 输入
    return MediaPlatform.UNKNOWN;
  }

  const lowercasedUrl = url.toLowerCase();

  // 抖音 URL 模式
  const douyinDomains: string[] = ["douyin.com", "iesdouyin.com"];
  if (douyinDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.DOUYIN;
  }

  // 小红书 URL 模式
  const xiaohongshuDomains: string[] = ["xiaohongshu.com", "xhslink.com", "xhs.cn"];
  if (xiaohongshuDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.XIAOHONGSHU;
  }

  // B站 URL 模式 (修正了 Python 代码中 bilibili.com 重复的问题)
  const bilibiliDomains: string[] = ["bilibili.com", "bilibili.cn"];
  if (bilibiliDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.BILIBILI;
  }

  // YouTube URL 模式
  // 请注意：以下 YouTube 的检测逻辑是根据你原始 Python 代码中非常特定的链接格式。
  // 它并不包含常见的 youtube.com 或 youtu.be 域名。
  // 如果你需要更通用的 YouTube 检测，这部分逻辑可能需要扩展。
  const youtubeSpecificFragments: string[] = [
    "youtu.be", 
    "youtube.com"
  ];
  if (youtubeSpecificFragments.some(fragment => lowercasedUrl.includes(fragment))) {
    return MediaPlatform.YOUTUBE;
  }
  // 如果需要更通用的 YouTube 检测，可以考虑添加：
  // const youtubeGeneralDomains: string[] = ["youtube.com", "youtu.be"];
  // if (youtubeGeneralDomains.some(domain => lowercasedUrl.includes(domain))) {
  //   return MediaPlatform.YOUTUBE;
  // }


  // Instagram URL 模式
  const instagramDomains: string[] = ["instagram.com"];
  if (instagramDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.INSTAGRAM;
  }

  // TikTok URL 模式
  const tiktokDomains: string[] = ["tiktok.com"];
  if (tiktokDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.TIKTOK;
  }

  // 快手 URL 模式
  const kuaishouDomains: string[] = ["kuaishou.com"];
  if (kuaishouDomains.some(domain => lowercasedUrl.includes(domain))) {
    return MediaPlatform.KUAISHOU;
  }
  
  // 未知平台
  return MediaPlatform.UNKNOWN;
}