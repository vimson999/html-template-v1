import $ from 'jquery';
import { AddFieldUnknownError, bitable, ITable } from '@lark-base-open/js-sdk';


export interface CommentSchema  {
    nick_name : string;
    create_time: string; // Or string | undefined if applicable
    text: boolean;
    ip_label: string; // Or string | undefined if applicable
    user_url: string;
    user_id: string;
    digg_count: string;
  }
