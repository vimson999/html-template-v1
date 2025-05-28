import $ from 'jquery';
import { bitable, ITable, IRecordValue, IFieldMeta } from '@lark-base-open/js-sdk'; // 确保导入了 IFieldMeta 和 IRecordValue
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

    // const result_data = await getTableData(input_values);
    // console.log('result_data is ', result_data?.result_data);

    // const title = 'test'
    // let table = await getTable(title,input_values.intentSelect,result_data?.platform);
    // console.log('table is ', table.getName);

    // await fillDataTable(table,result_data.result_data);

    let fields = [
      { name: "a", type: 1 },
      { name: "b", type: 1 },
      { name: "c", type: 1 }
    ];
    let sf = Date.now();
    const addResult = await bitable.base.addTable({
      name: 'test' +sf ,
      fields: fields
    });
    const table = await bitable.base.getTableById(addResult.tableId);
    // await table.addRecord({fields: {
    //   a: '1',
    //   b: '2',
    //   c: '3'
    // }});
    const textField = await table.getField('a');

    const textCell = await textField.createCell('new text field value');
    const recordId = await table.addRecord(textCell);
    
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




  async function fillDataTable(table: ITable, result_data: CommentSchema[]) {
    const tableName = await table.getName();
  
    if (!result_data || !Array.isArray(result_data) || result_data.length === 0) {
      console.warn(`向表格 "${tableName}" 填充的数据 (result_data) 为空或格式不正确。`);
      // window.LarkDocs?.Toast?.warning('没有数据可以写入表格。');
      return;
    }
  
    // window.LarkDocs?.Toast?.info(`准备向表格 "${tableName}" 批量写入 ${result_data.length} 条数据...`);
    console.log(`准备向表格 "${tableName}" 批量写入 ${result_data.length} 条数据 (使用字段名)...`);
    
    try {
      // 1. 获取表格的字段元数据
      const fieldsMeta = await table.getFieldList();
      console.log('fieldsMeta is ', fieldsMeta);
      // 2. 准备要批量添加的记录数据 (直接是字段名 -> 值的对象)

      // const cell = await table.getFieldById('fldiHlcFOw');
      // console.log('cell is ', cell);

      // const keys = fieldsMeta.keys();
      // keys.forEach(key => {
      //   console.log('key is ', key);
      // });

      const cell0 = fieldsMeta[0];
      console.log('cell0 is ', cell0);
      // fldiHlcFOw

      const record = { fidleds : {} };
      // await table.addRecord(record);
    }catch (error) {
      console.log('error is ', error);
    }
    

    return;

    try {
      const itemPropertyToTableFieldNameMap: { [K in keyof CommentSchema]?: string } = {
        nick_name: '昵称',
        create_time: '评论时间',
        text: '内容',
        ip_label: 'IP属地',
        user_url: '用户主页',
        user_id: '用户ID',
        digg_count: '点赞数'
      };
  
      // (可选的字段名校验逻辑可以保留)
  
      // 2. 准备要批量添加的记录数据 (直接是字段名 -> 值的对象)
      // 修改点在这里：map 的结果直接是 IRecordValue，而不是 { fields: IRecordValue }
      const recordsToCreate: IRecordValue[] = result_data.map(item => { // <--- 修改类型和返回值
        const fieldsForRecord: IRecordValue = {fields: {}};
        for (const itemKey in itemPropertyToTableFieldNameMap) {
          const tableFieldName = itemPropertyToTableFieldNameMap[itemKey as keyof CommentSchema];
          if (tableFieldName && item.hasOwnProperty(itemKey as keyof CommentSchema)) {
            // @ts-ignore
            fieldsForRecord[tableFieldName] = item[itemKey as keyof TransformedCommentItem];
          }
        }
        return fieldsForRecord; // <--- 直接返回 fieldsForRecord 对象
      }).filter(record => record && Object.keys(record).length > 0); // 确保记录不为空且有有效字段
  
      if (recordsToCreate.length === 0) {
        console.warn(`没有有效的记录可以添加到表格 "${tableName}"。`);
        // window.LarkDocs?.Toast?.warning('没有有效数据可写入。');
        return;
      }
  
      // 3. 批量添加记录
      const BATCH_SIZE = 100;
      let successfullyAddedCount = 0;
      const totalToAttempt = recordsToCreate.length;
      let presumedFailedCount = 0;
  
      console.log(`准备分批添加 ${totalToAttempt} 条记录到表格 "${tableName}"...`);
  
      for (let i = 0; i < totalToAttempt; i += BATCH_SIZE) {
        // chunk 现在是 IRecordValue[] 类型，符合第一个重载的期望
        const chunk: IRecordValue[] = recordsToCreate.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        try {
          // 调用 addRecords 时，参数 chunk 的类型现在应该是 IRecordValue[]
          await table.addRecords(chunk); 
          successfullyAddedCount += chunk.length;
          console.log(`成功添加 ${chunk.length} 条记录 (批次 ${batchNumber}) 到 "${tableName}"。`);
          // window.LarkDocs?.Toast?.success(`已成功写入 ${chunk.length} 条数据 (批次 ${batchNumber})。`);
        } catch (batchError) {
          presumedFailedCount += chunk.length;
          console.error(`批量添加记录时出错 (表格 "${tableName}", 批次 ${batchNumber}):`, batchError);
          // window.LarkDocs?.Toast?.error(`数据写入失败 (批次 ${batchNumber})，详情请查看控制台。`);
        }
      }
      
      const finalMessage = `数据填充完成 (使用字段名)。表格: "${tableName}". 
        总共尝试: ${totalToAttempt} 条. 
        成功写入: ${successfullyAddedCount} 条. 
        失败(或未确认成功): ${totalToAttempt - successfullyAddedCount} 条.`;
      console.log(finalMessage);
      // ... (后续的用户反馈逻辑不变) ...
  
    } catch (error) {
      const criticalErrorMessage = `填充数据到表格 "${tableName || '未知表格'}" 过程中发生严重错误: ${(error as Error).message}`;
      console.error(criticalErrorMessage, error);
      // window.LarkDocs?.Toast?.error(criticalErrorMessage);
    }
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

