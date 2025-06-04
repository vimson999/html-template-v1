import $ from 'jquery';
import { AddFieldUnknownError, bitable, ITable } from '@lark-base-open/js-sdk';


export interface CommentSchema  {
    nick_name : string;
    create_time: string; // Or string | undefined if applicable
    text: string;
    ip_label: string; // Or string | undefined if applicable
    user_url: string;
    user_id: string;
    digg_count: string;
  }




// API 返回数据项中 author 字段的结构 (如果存在)
export interface KeyWordSearchAuthorInfo {
  nickname?: string | null;
  url?: string | null;
  // 根据实际情况添加其他可能用到的 author 字段
}

// API 返回的原始数据项的结构
export interface KeyWordSearchApiDataItem {
  title?: string | null;
  description?: string | null;
  platform?: string | null;
  publish_time?: string | number | null | undefined; // 发布时间可以是字符串 (ISO格式) 或数字 (时间戳)
  play_count?: number | null;
  like_count?: number | null;
  comment_count?: number | null;
  share_count?: number | null;
  collect_count?: number | null;
  author?: KeyWordSearchAuthorInfo | null;
  video_platform_url?: string | null;
  cover_url?: string | null;
  video_url?: string | string[] | null; // video_url 可能为单个URL字符串、URL数组或类数组字符串
  tags?: string | null;
  duration?: number | null;
  point_cost?: number | null;
  // 根据您的实际API响应添加或修改其他字段
}

// 转换后用于飞书表格的数据项结构
export interface KeyWordSearchFeishuFormattedItem {
  "标题": string;
  "描述": string;
  "平台": string;
  "发布时间": string; // 由 formatPublishTime 处理后的字符串
  "播放数": number;    // 期望在飞书表格中为数字类型
  "点赞数": number;    // 期望在飞书表格中为数字类型
  "评论数": number;
  "分享数": number;
  "收藏数": number;
  "作者昵称": string;
  "作者主页": string;
  "作品链接": string;
  "封面图片链接": string;
  "内容链接": string;
  "标签": string;
  "时长(秒)": number;
  "采集成本": number;
}




export interface AuthorBasicAPISchema {
  platform?: string | null;
  user_id_platform?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  bio_signature?: string | null;
  follower_count?: number | null;
  following_count?: number | null;
  total_engagement?: number | null; // 总互动量 (例如点赞、评论、分享、收藏等的总和)
  post_count?: number | null;
  ip_location?: string | null;
  original_url?: string | null; // 这是作者的主页链接
  // 根据实际API可能返回的其他字段，可以继续添加
}

export interface AuthorBasicFormatted {
  "平台"?: string;
  "平台用户ID"?: string;
  "作者昵称"?: string;
  "头像链接"?: string;
  "个性签名"?: string;
  "粉丝数"?: number;
  "关注数"?: number;
  "总互动量"?: number; // 或 "总热度", "总参与度" 等，根据实际含义调整
  "作品数"?: number;
  "IP属地"?: string;
  "作者主页"?: string;
  // 如果有其他需要展示的字段，在此添加中文列名和类型
}


export interface VideoBasicApiData {
  title: string;
  authorName: string;
  description: string;
  publishTime: string | null; // ISO 格式的日期字符串或 null
  likeCount: number;
  collectCount: number;
  shareCount: number;
  commentCount: number;
  tags: string; // 逗号分隔的字符串
  coverUrl: string;
  videoUrl: string;
  content: string; // 文案字段
}

// 2. 定义转换后用于飞书表格的结构 (中文列名)
export interface VideoBasicFormatted {
  "标题": string;
  "作者": string;
  "描述": string;
  "发布时间": string; // 格式化后的日期字符串 "YYYY-MM-DD HH:mm:ss"
  "点赞数": number;
  "收藏数": number;
  "分享数": number;
  "评论数": number;
  "标签": string;
  "封面链接": string;
  "视频链接": string;
  "文案内容": string;
}



export interface KOLPostsFormatted {
  '标题'?: string | null;
  '类型': string;
  '平台': string;
  '作者昵称'?: string | null;
  '作者ID'?: string | null;
  '发布时间'?: string | null;
  '点赞数'?: number | null;
  '评论数'?: number | null;
  '收藏数'?: number | null;
  '分享数'?: number | null;
  '作品ID': string;
  '作品链接'?: string | null;
  '封面链接'?: string | null;
  '视频链接'?: string | null;
  '视频时长(秒)'?: number | null;
  '图片链接列表'?: string | null; // 换行分隔的字符串
  '作者头像链接'?: string | null;
}

export interface KOLPostsInput {
  note_id: string;
  title?: string | null;
  platform: string;
  media_type: string;
  author_nickname ?: string | null;
  author_id?: string | null;
  video_url?: string | null;
  video_duration?: number | null;
  like_count?: number | null;
  comment_count?: number | null;
  collect_count?: number | null;
  share_count?: number | null;
  post_url?: string | null;
  cover_image_url?: string | null;
  author_avatar_url?: string | null;
  image_urls?: string[] | null;
  create_time?: string | null; // ISO 8601 格式
}