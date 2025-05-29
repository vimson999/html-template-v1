// src/index.ts
import $ from 'jquery'; //
import { bitable, ITable, IRecordValue, IFieldMeta, FieldType, ToastType, IFieldConfig, ICell } from '@lark-base-open/js-sdk'; //
import './index.scss'; //
import {
  getCleanUrl,                //
  inferFieldTypeFromValue,    //
  getTable,                   //
  FormValues,                 //
  getFormValuesAndValidate,   //
  convertDYComment,           //
  convertXHSComment,          //
  identifyPlatform,           //
  MediaPlatform               //
} from './helper';
import { CommentSchema } from './schema'; //

// import './locales/i18n'; // 开启国际化，详情请看README.md

async function fillDataTable(
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


$(async function () { //
  const ui = bitable.ui; // 在顶层作用域获取 ui 对象 //

  // --- 初始化代码 ---
  const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]); //
  const optionsHtml = tableList.map(table => { //
    return `<option value="${table.id}">${table.name}</option>`; //
  }).join(''); //
  $('#tableSelect').append(optionsHtml); //
  if (selection && selection.tableId) { //
    $('#tableSelect').val(selection.tableId); //
  }
  // --- 初始化结束 ---

  $('#addRecord').on('click', async function () { //
    console.log('[onClick] 按钮被点击'); //
    $(this).prop('disabled', true).text('执行中...'); //

    await ui.showToast({ toastType: ToastType.info, message: "操作开始，正在处理..." }); //

    let wasTableDynamicallyCreated = false; //

    try { //
      const input_values = getFormValuesAndValidate(); //
      if (!input_values) { //
        return; //
      }
      console.log('[onClick] Input Values:', input_values); //

      let tip = '正在获取【'+ input_values.intentSelect+'】数据...';
      await ui.showToast({ toastType: ToastType.info, message: tip }); //
      const apiResponse = await getTableData(input_values); //
      console.log('[onClick] API Response:', apiResponse); //

      if (!apiResponse || !apiResponse.result_data) { //
        console.warn('[onClick] API未返回有效数据 (result_data 为空)。'); //
        await ui.showToast({ toastType: ToastType.warning, message: "API未返回有效数据" }); //
        return; //
      }

      const dataToProcess = Array.isArray(apiResponse.result_data) ? apiResponse.result_data : [apiResponse.result_data]; //

      if (dataToProcess.length === 0 || (dataToProcess.length > 0 && (typeof dataToProcess[0] !== 'object' || dataToProcess[0] === null))) { //
        console.warn('[onClick] 处理后的数据为空或格式不正确。'); //
        await ui.showToast({ toastType: ToastType.warning, message: "未能获取到有效待处理数据" }); //
        return; //
      }
      console.log('[onClick] Data to Process Count:', dataToProcess.length); //

      let title = '';
      let tablePara = {
        "tableOption": input_values.radioCreate ? "create" : "select",
        "tableSelect": input_values.tableSelect,
        "intentSelect": input_values.intentSelect,
      };
      const table = await getTable( //
        tablePara,
        title, //
        apiResponse.platform, //
        input_values.radioCreate ? dataToProcess : undefined //
      );

      if (!table) { //
        console.error('[onClick] 未能获取或创建表格对象。'); //
        return; //
      }
      const tableName = await table.getName(); //
      console.log(`[onClick] 操作表格: "${tableName}" (ID: ${table.id})`); //

      if (input_values.radioCreate) { //
        wasTableDynamicallyCreated = true; //
      }

      await fillDataTable( //
        table, //
        dataToProcess, //
        wasTableDynamicallyCreated //
      );

      if (wasTableDynamicallyCreated) { //
        try { //
          await ui.switchToTable(table.id); //
          console.log(`[onClick] 已切换到新创建的表格: "${tableName}"`); //
        } catch (e) { //
          console.warn(`[onClick] 切换到新表格 "${tableName}" 失败:`, e); //
        }
      }
      console.log('[onClick] 主要操作流程执行完毕。'); //

    } catch (error) { //
      console.error('[onClick] “立即执行”过程中发生顶层错误:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `操作执行失败: ${(error as Error).message}` }); //
    } finally { //
      $('#addRecord').prop('disabled', false).text('立即执行'); //
      console.log('[onClick] 操作流程结束 (finally)。'); //
    }
  });


  async function getTableData(input_values: FormValues) { //
    const ui = bitable.ui; // 在函数内部获取 ui 对象 //
    const intentSelect = input_values.intentSelect; //
    const origin_input = input_values.inputValue; //
    const apiKey = input_values.apiKey; //

    console.log('[getTableData] origin_input is ', origin_input); //
    const input_url = getCleanUrl(origin_input) ?? origin_input; //
    const platform = identifyPlatform(input_url); //
    console.log('[getTableData] input_url is ', input_url, platform); //

    const headers = { //
      'Content-Type': 'application/json', //
      'Authorization': `Bearer ${apiKey}` //
    };

    const activeDomain = 'http://localhost:8083'; //
    const host_base = activeDomain.startsWith('http') ? activeDomain : `http://${activeDomain}`; //

    let result_data_from_api; //
    switch (intentSelect) { //
      case '基础文案': //
        result_data_from_api = await getVideoBasic(host_base, input_url, headers); //
        break; //
      case '视频趋势': //
        result_data_from_api = await getVideoTrend(host_base, input_url, headers); //
        break; //
      case '评论': //
        result_data_from_api = await getVideoComment(host_base, input_url, headers, platform); //
        break; //
      case '关键字': //
        result_data_from_api = await getKeywordsSearch(host_base, input_url, headers); //
        break; //
      case '作者':  //
        result_data_from_api = await getKOLBasic(host_base, input_url, headers); //
        break; //
      case '作品集':  //
        result_data_from_api = await getKOLPosts(host_base, input_url, headers); //
        break; //
      case '作者趋势': //
        result_data_from_api = await getKOLTrends(host_base, input_url, headers); //
        break; //
      default: //
        await ui.showToast({ toastType: ToastType.warning, message: `未选择或不支持的数据意图: ${intentSelect}` }); //
        return { result_data: null, platform }; //
    }

    return { result_data: result_data_from_api, platform }; //
  }

  async function getVideoBasic(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }

  async function getVideoTrend(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }
  async function getKeywordsSearch(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }
  async function getKOLBasic(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }
  async function getKOLPosts(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }
  async function getKOLTrends(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }

  async function getVideoComment(host_base: string, inputValue: string, headers: any, platformParam: MediaPlatform | undefined) { //
    const ui = bitable.ui; // 获取ui对象 //
    const comment_api_path = '/api/tt/vcl';  //
    const full_api_path = `${host_base}${comment_api_path}`; //

    try { //
      console.log(`[getVideoComment] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({ url: inputValue })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getVideoComment] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const data = await response.json(); //
      console.log('[getVideoComment] Raw API Response:', data); //

      const origin_commentsList = data?.data?.comments; //
      const apiPlatform = data?.data?.platform as MediaPlatform;  //

      if (origin_commentsList && Array.isArray(origin_commentsList)) { //
        let convertedCommentData; //
        const platformToUse = apiPlatform || platformParam; //

        if (platformToUse === MediaPlatform.DOUYIN) { //
          convertedCommentData = convertDYComment(origin_commentsList); //
        } else if (platformToUse === MediaPlatform.XIAOHONGSHU) { //
          convertedCommentData = convertXHSComment(origin_commentsList); //
        } else { //
          console.warn(`[getVideoComment] Unknown or unhandled platform: ${platformToUse}`); //
          await ui.showToast({ toastType: ToastType.warning, message: `评论转换暂不支持平台: ${platformToUse}` }); //
          convertedCommentData = origin_commentsList;  //
        }
        console.log('[getVideoComment] Converted Comment Data:', convertedCommentData); //
        return convertedCommentData; //
      } else { //
        console.warn('[getVideoComment] Comments list not found or not an array in API response.'); //
        await ui.showToast({ toastType: ToastType.warning, message: 'API未返回有效的评论列表' }); //
        return null; //
      }
    } catch (error) { //
      console.error('[getVideoComment] Error fetching or processing video comments:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取评论数据失败: ${(error as Error).message.substring(0, 100)}` }); // 截断过长的错误信息 //
      return null; //
    }
  }

}); //