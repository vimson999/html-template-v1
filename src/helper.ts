import $ from 'jquery';
import { AddFieldUnknownError, bitable, ITable } from '@lark-base-open/js-sdk';

export async function getTable(title: string) {
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
        fields: getDefaultFields()
      });

      table = await bitable.base.getTableById(addResult.tableId);
    } else {
      const tableId = $('#tableSelect').val();
      table = await bitable.base.getTableById(tableId as string);
    }

    return table;
  }


  export function getDefaultFields() {
    return [
      { name: "a", type: 1 },
      { name: "b", type: 1 },
      { name: "c", type: 1 }
    ];
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