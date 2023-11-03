const BASE_API = "https://azcorp-marica-api.vercel.app";

document.addEventListener("alpine:init", () => {
  let loginInstance;
  Alpine.data("login", () => ({

    logged: false,

    buttonBusy: false,

    error: null,

    form: {
      senha: "",
      cpf: "",
    },

    service: {
      peoplesInQueue: 0,
      password: null,
      ticketWindow: null,
      // finished: false,
      // canceled: false,
      // waitingQueue: false,

      status: '',
      userName: ''
    },

    init() {
      const storedCpf = localStorage.getItem('cpf');
      const storedSenha = localStorage.getItem('senha');


      if (storedCpf && storedSenha) {
        // Se os dados de login estiverem disponíveis, tente fazer o login automático
        this.attemptAutoLogin(storedCpf, storedSenha)
      }

      // ;(function pool() {


      //   // Código aqui

      //   if (this.logged) {
      //     // Quando logado, faz o polling da senha
      //     // API aqui
      //     this.service.peoplesInQueue = Math.max(0, this.service.peoplesInQueue - 1); 
      //   }

      //   if  (this.service.peoplesInQueue == 0 && !this.service.password) {
      //     this.service.password = parseInt(Math.random() * 1000, 10).toString().padStart(4, '0');
      //     this.service.ticketWindow = parseInt(Math.random() * 15, 10).toString()
      //   }

      //   setTimeout(pool.bind(this), 3000);
      // }).call(this);
    },
    
    async attemptAutoLogin(cpf, senha) {
      const payload = {
        queue_number: senha,
        user_doc: cpf,
        checkin_pa: "1"
      };
      
      setTimeout(() => {
        location.reload(true) ; // Chama a função novamente após 1 minuto
      }, 60000);

      // Faça uma solicitação de login automático para o servidor.
      const response = await fetch(`${BASE_API}/api/subscribers/getQueueStatusBySubscriber`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
    
      if (isSuccessResponse(response)) {
        // O login automático foi bem-sucedido, o usuário está logado.
        // Atualize o estado da aplicação como se o usuário tivesse feito login manualmente.
        this.logged = true;
    
        const { data, msg_code } = await response.json();
    
        // Atualize os detalhes do usuário e qualquer outra informação necessária.
        this.service.ticketWindow = data.subscriber.desk_number;
        this.service.peoplesInQueue = data.queueEstimatedPosition;
        this.service.password = data.subscriber.id;
        this.service.userName = data.subscriber.user_name;
        this.service.sector = data.subscriber.sector_metadata.name;
    
        // Defina o status com base no msg_code.
        if (msg_code === 'subscriber_completed_support_successfully') {
          this.service.status = 'finished';
        } else if (msg_code === 'subscriber_waiting_in_queue') {
          this.service.status = 'queue';
        } else if (msg_code === 'subscriber_canceled_but_will_be_called_again') {
          this.service.status = 'canceled';
        } else if (msg_code === 'subscriber_in_support_now') {
          this.service.status = 'started';
        } else {
          this.service.status = 'called';
        }

      } else {
        // O login automático falhou ou as credenciais não são mais válidas.
        // Limpe os dados de login armazenados no Local Storage.
        localStorage.removeItem('cpf');
        localStorage.removeItem('senha');
      }
    },

    async login() {
      this.error = null;
      const payload = {
        queue_number: this.form.senha,
        user_doc: this.form.cpf.replace(/\D+/g, ""),
        checkin_pa: "1"
      };

      if (! this.form.senha) {
        this.error = 'A senha deve ser informada.';

      } else if (!validCpf(payload.user_doc)) {
        this.error = "O CPF é inválido.";
        return;
      }

      this.buttonBusy = true;

      const response = await fetch(`${BASE_API}/api/subscribers/getQueueStatusBySubscriber`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.buttonBusy = false;

      if (isSuccessResponse(response)) {

        // salvar CPF e senha no local storage
        localStorage.setItem('cpf', payload.user_doc);
        localStorage.setItem('senha', this.form.senha);

        this.logged = true;

        const { data, msg_code } = await response.json();

        this.service.ticketWindow   = data.subscriber.desk_number;
        this.service.peoplesInQueue = data.queueEstimatedPosition;
        this.service.password       = data.subscriber.id;
        this.service.userName       = data.subscriber.user_name;
        this.service.sector         = data.subscriber.sector_metadata.name

        if (msg_code === 'subscriber_completed_support_successfully') {
          this.service.status = 'finished';
        } else if (msg_code === 'subscriber_waiting_in_queue') {
          this.service.status = 'queue';
        } else if (msg_code === 'subscriber_canceled_but_will_be_called_again') {
          this.service.status = 'canceled';
        } else if (msg_code === 'subscriber_in_support_now') {
          this.service.status = 'started';
        } else {
          this.service.status = 'called';
        }


        console.log(this.service)

        return;
      }

      this.error = (await response.json()).msg
    },
  }))



  /**
   * @param {Response} response
   * @returns {Boolean}
   */
  function isSuccessResponse(response) {
    return response.status >= 200 && response.status <= 299;
  }

  /**
   * @param {Response} response
   * @returns {Boolean}
   */
  function isClientErrorResponse(response) {
    return response.status >= 400 && response.status <= 499;
  }

  /**
   *
   * @param {String} cpf
   * @returns {Boolean}
   */
  function validCpf(cpf) {
    if (
      !cpf ||
      cpf.length != 11 ||
      cpf == "000000000" ||
      cpf == "11111111111" ||
      cpf == "22222222222" ||
      cpf == "33333333333" ||
      cpf == "44444444444" ||
      cpf == "55555555555" ||
      cpf == "66666666666" ||
      cpf == "77777777777" ||
      cpf == "88888888888" ||
      cpf == "99999999999"
    )
      return false;
    var soma = 0;
    var resto;
    for (var i = 1; i <= 9; i++)
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (var i = 1; i <= 10; i++)
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(10, 11))) return false;
    return true;
  }
});
