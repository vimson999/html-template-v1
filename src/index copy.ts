import $ from 'jquery';
import { bitable } from '@lark-base-open/js-sdk';
import './index.scss';
// import './locales/i18n'; // 开启国际化，详情请看README.md


$(async function() {
  const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]);
  const optionsHtml = tableList.map(table => {
    return `<option value="${table.id}">${table.name}</option>`;
  }).join('');
  $('#tableSelect').append(optionsHtml).val(selection.tableId!);
  $('#addRecord').on('click', async function() {
    const tableId = $('#tableSelect').val();
    if (tableId) {
      const table = await bitable.base.getTableById(tableId as string);
      table.addRecord({
        fields: {},
      });
    }
  });
});