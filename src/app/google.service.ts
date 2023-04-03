import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  //Config ứng dụng tại https://console.cloud.google.com/
  private config = {
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    client_id:
      '274989640457-5heeqkqk8ikpb2nmqdq8ldkt7jb2qjat.apps.googleusercontent.com',
    api_key: 'AIzaSyCHJedne8ljsoKXUp9apqec-QsWyvjpuEo',
    app_id: '274989640457',
  };

  //Token khi đăng nhập google
  private accessToken: any = null;

  //Token Dịch vụ
  //Oauth2 với google để sử dụng các service
  private tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: this.config.client_id,
    scope: this.config.scope,
    callback: (res: google.accounts.oauth2.TokenResponse) => {
      if (res.error !== undefined) {
        throw res;
      }
      this.accessToken = res.access_token;
      localStorage.setItem('token', res.access_token);

      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .addView(google.picker.ViewId.DOCS)
        .setDeveloperKey(this.config.api_key)
        .setAppId(this.config.api_key)
        .setOAuthToken(res.access_token)
        .setCallback(this.pickerCallback)
        .build();
      picker.setVisible(true);
    },
  });

  //Dữ liệu truyền sang component
  public dataFromPicker!: Subject<any>;

  constructor() {
    //Tải về Google Driver API và Google Picker API
    this.dataFromPicker = new Subject<any[]>();
    gapi.load('client:picker', async () => {
      await gapi.client.load(
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
      );
    });
  }

  //Mở Google Picker
  //Trước khi mở phải check người dùng đã đăng nhập google chưa
  createPicker() {
    if (this.accessToken === null) {
      // Nhắc người dùng chọn Tài khoản Google và yêu cầu đồng ý chia sẻ dữ liệu của họ
      // khi thiết lập một phiên làm việc mới.
      this.tokenClient.requestAccessToken({
        prompt: 'consent',
      });
    } else {
      // Bỏ qua hiển thị bộ chọn tài khoản và hộp thoại đồng ý nêu người dùng đã đăng nhập.
      this.tokenClient.requestAccessToken({
        prompt: '',
      });
    }
  }

  //Hàm được sử dụng khi xác nhận các file được chọn từ Google Picker
  pickerCallback = async (data: google.picker.ResponseObject) => {
    if (data.action === google.picker.Action.PICKED) {
      let files: File[] = [];
      for (const file of data.docs) {
        if (file.type == google.picker.Type.DOCUMENT) {
          let mimeType = '';
          if (file.mimeType == 'application/vnd.google-apps.spreadsheet')
            mimeType =
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          else if (file.mimeType == 'application/vnd.google-apps.document')
            mimeType =
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          const res = await gapi.client.drive.files.export({
            fileId: file.id,
            mimeType: mimeType,
          });
          files.push(new File([res.body], file.name, { type: mimeType }));
        } else {
          const res = await gapi.client.drive.files.get({
            fileId: file.id,
            alt: 'media',
          });
          files.push(new File([res.body], file.name, { type: file.mimeType }));
        }
      }
      this.dataFromPicker.next(files);
    }
  };

  //Đăng xuất khỏi tài khoản Google hiện tại
  logout() {
    google.accounts.oauth2.revoke(this.accessToken, () => {});
    localStorage.clear();
    this.accessToken = null;
  }
}
