import $ from 'jquery';
import { bitable, ITable } from '@lark-base-open/js-sdk';
import './index.scss';
import { getCleanUrl, getTable, FormValues, getFormValuesAndValidate, convertDYComment ,convertXHSComment,identifyPlatform,MediaPlatform } from './helper';
import { CommentSchema } from './schema';

// import './locales/i18n'; // 开启国际化，详情请看README.md


$(async function () {
  const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]);
  const optionsHtml = tableList.map(table => {
    return `<option value="${table.id}">${table.name}</option>`;
  }).join('');
  $('#tableSelect').append(optionsHtml).val(selection.tableId!);

  $('#addRecord').on('click', async function () {
    console.log('按钮被点击');

    const input_values = getFormValuesAndValidate();
    if (!input_values) return;

    const result_data = await getTableData(input_values);
    console.log('result_data is ', result_data?.result_data);

    const title = 'test'
    let table = await getTable(title,input_values.intentSelect,result_data?.platform);
    console.log('table is ', table.getName);

    await fillDataTable(table,result_data.result_data);
  });


  async function getTableData(input_values: FormValues) {
    const intentSelect = input_values.intentSelect;
    const origin_input = input_values.inputValue;
    const apiKey = input_values.apiKey;

    console.log('origin_input is ', origin_input);
    const input_url = getCleanUrl(origin_input) ?? origin_input;
    const platform = identifyPlatform(input_url);
    console.log('input_url is ', input_url,platform);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const activeDomain = 'http://localhost:8083'; // Fallback just in case
    // // const activeDomain = 'http://42.192.40.44:8083'
    const host_base = activeDomain.startsWith('http') ? activeDomain : `http://${activeDomain}`; // Ensure protocol

    let result_data;
    switch (intentSelect) {
      case 'get_caption':
        result_data = await getVideoBasic(host_base, input_url, headers);
        break;
      case 'analyze_trend':
        result_data = await getVideoTrend(host_base, input_url, headers);
        break;
      case 'get_comments':
        result_data = await getVideoComment(host_base, input_url, headers);
        break;
      case 'keyword_search':
        result_data = await getKeywordsSearch(host_base, input_url, headers);
        break;
      case 'get_author':  // 注意：这里有两个相同value需要区分
        result_data = await getKOLBasic(host_base, input_url, headers);
        break;
      case 'get_author_works':  // 建议拆分value
        result_data = await getKOLPosts(host_base, input_url, headers);
        break;
      case 'analyze_author':
        result_data = await getKOLTrends(host_base, input_url, headers);
        break;
      default:
        alert('未选择获取的数据');
    }

    return { result_data,platform };
  }



  async function fillDataTable(table: ITable,result_data: any) {
    // await table.addRecord({
    //   fields: {
    //     a: "a1",
    //     b: "b1",
    //     c: "c1"
    //   }
    // });
    if (!result_data) {
      console.error('result_data is empty');
      return;
    }

    if (Array.isArray(result_data)) {
      console.log('Table fields:', await table.getFieldList());
      
      for (const item of result_data) {
        try {
          await table.addRecord({
            fields: {
              昵称: item.nick_name,
              评论时间: item.create_time,
              内容: item.text,
              IP属地: item.ip_label,
              用户主页: item.user_url,
              用户ID: item.user_id,
              点赞数: item.digg_count
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    console.log('fill done ', table);
  }


  async function getVideoBasic(host_basebase_url: string, inputValue: string, headers: any) {
    // const extract_api_path = '/api/media/extract';
    // const status_api_path_base = '/api/media/extract/status/'; // Base path for status
    // const response = await context.fetch(`${host_base}${extract_api_path}`, {

    return null;
  }

  async function getVideoTrend(host_base: string, inputValue: string, headers: any) {
    return null;
  }


  async function getKeywordsSearch(host_base: string, inputValue: string, headers: any) {
    return null;
  }

  async function getKOLBasic(host_base: string, inputValue: string, headers: any) {
    return null;
  }

  async function getKOLPosts(host_base: string, inputValue: string, headers: any) {
    return null;
  }

  async function getKOLTrends(host_base: string, inputValue: string, headers: any) {
    return null;
  }

  async function getVideoComment(host_base: string, inputValue: string, headers: any) {
    const comment_api_path = '/api/tt/vcl';
    const full_api_path = `${host_base}${comment_api_path}`;

    try {
      const response = await fetch(full_api_path, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url: inputValue })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getVideoComment response:', data);

      // 提取 comments 列表
      const platform = data.data.platform;
      const origin_commentsList = data.data.comments;
      // 现在 commentsList 就是你想要的那个包含所有评论对象的数组
      console.log('platform is , 提取到的评论列表:', platform, origin_commentsList);

      let commentDataList;
      if (origin_commentsList && Array.isArray(origin_commentsList)) {
        if (platform === 'douyin') {
          commentDataList = convertDYComment(commentDataList, origin_commentsList);
        }else if ( platform === 'xiaohongshu' ) {
          commentDataList = convertXHSComment(commentDataList, origin_commentsList);
        }
        
        // 现在 commentDataList 就是转换后的、符合 CommentData 接口的列表了
        console.log('转换后的 CommentData 列表:', commentDataList);
      } else {
        console.error('origin_commentsList 不是一个有效的数组或未定义。');
      }

      return commentDataList;
    } catch (error) {
      console.error('Error in getVideoComment:', error);
      return null;
    }
  }
});

