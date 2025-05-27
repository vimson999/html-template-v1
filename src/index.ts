import $ from 'jquery';
import { bitable, ITable } from '@lark-base-open/js-sdk';
import './index.scss';
import { getTable,FormValues,getFormValuesAndValidate } from './helper';

// import './locales/i18n'; // 开启国际化，详情请看README.md


$( async function () {
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

    const title = 'test'
    let table = await getTable(title);
    console.log('table is ', table.getName);

    await fillDataTable(table);
  });


  async function getTableData(input_values : FormValues) {
    const intentSelect = input_values.intentSelect;
    const inputValue = input_values.inputValue;
    const apiKey = input_values.apiKey;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    const base_url = '/v1';
    

    let result_data;
    switch (intentSelect) {
      case 'get_caption':
        result_data = await getVideoBasic(base_url, inputValue, headers);
        break;
      case 'analyze_trend':
        result_data = await getVideoTrend(base_url, inputValue, headers);
        break;
      case 'get_comments':
        result_data = await getVideoComment(base_url, inputValue, headers);
        break;
      case 'keyword_search':
        result_data = await getKeywordsSearch(base_url, inputValue, headers);
        break;
      case 'get_author':  // 注意：这里有两个相同value需要区分
        result_data = await getKOLBasic(base_url, inputValue, headers);
        break;
      case 'get_author_works':  // 建议拆分value
        result_data = await getKOLPosts(base_url, inputValue, headers);
        break;
      case 'analyze_author':
        result_data = await getKOLTrends(base_url, inputValue, headers);
        break;
      default:
        alert('未选择获取的数据');
        return null;
    }

    return result_data;
  }



  async function fillDataTable(table: ITable) {
    // await table.addRecord({
    //   fields: {
    //     a: "a1",
    //     b: "b1",
    //     c: "c1"
    //   }
    // });

    console.log('fill done ', table);

  }


  async function getVideoBasic(base_url: string,inputValue : string, headers : any ) {
    return null;
  }

  async function getVideoTrend(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  async function getVideoComment(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  async function getKeywordsSearch(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  async function getKOLBasic(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  async function getKOLPosts(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  async function getKOLTrends(base_url: string,inputValue : string, headers : any) {
    return null;
  }

  
});

