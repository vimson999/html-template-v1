import $ from 'jquery';
import { AddFieldUnknownError, bitable, ITable } from '@lark-base-open/js-sdk';
import './index.scss';
// import './locales/i18n'; // 开启国际化，详情请看README.md


$(async function () {
  const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]);
  const optionsHtml = tableList.map(table => {
    return `<option value="${table.id}">${table.name}</option>`;
  }).join('');
  $('#tableSelect').append(optionsHtml).val(selection.tableId!);

  $('#addRecord').on('click', async function () {
    console.log('按钮被点击');

    const values = getFormValuesAndValidate();
    if (!values) return;

    const title = ''
    const radioCreate = (document.getElementById('radioCreate') as HTMLInputElement)?.checked;
    const intentSelect = (document.getElementById('intentSelect') as HTMLSelectElement)?.value;
    const randomSuffix = Date.now();

    console.log('radioCreate is ', radioCreate);

    let table = await getTable();
    await fillDataTable(table);
  });

  
  async function getTable() {
    const title = ''
    const radioCreate = (document.getElementById('radioCreate') as HTMLInputElement)?.checked;
    const intentSelect = (document.getElementById('intentSelect') as HTMLSelectElement)?.value;
    const randomSuffix = Date.now();

    console.log('radioCreate is ', radioCreate);
    let table;
    if (radioCreate) {
      const tableName = `【${title}】_${randomSuffix}`;
      const addResult = await bitable.base.addTable({
        name: tableName,
        fields: getDefaultFields()
      });

      table = await bitable.base.getTableById(addResult.tableId);
    }else {
      const tableId = $('#tableSelect').val();
      table = await bitable.base.getTableById(tableId as string);
    }

    return table;
  }
  async function fillDataTable(table: ITable) {
    await table.addRecord({
      fields: {
        a: "a1",
        b: "b1",
        c: "c1"
      }
    });
  }

  function getDefaultFields() {
    return [
      { name: "a", type: 1 },
      { name: "b", type: 1 },
      { name: "c", type: 1 }
    ];
  }

  function getVideoBasic() {
    return null;
  }

  function getVideoTrend() {
    return null;
  }

  function getVideoComment() {
    return null;
  }

  function getKeywordsSearch() {
    return null;
  }

  function getKOLBasic() {
    return null;
  }

  function getKOLPosts() {
    return null;
  }

  function getKOLTrends() {
    return null;
  }

  function getFormValuesAndValidate() {
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
});