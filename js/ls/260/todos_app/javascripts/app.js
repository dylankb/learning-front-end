var idCounter = function() {
  var id = 0;

  return function determineId(lastId) {
    lastId ? id = lastId : id += 1;
    return id;
  };
};
var todoCounter = idCounter();

var App = {
  init: function() {
    this.cacheTemplates();
    this.createHelpers();

    this.TodoMonths = new TodoMonthsCollection();
    this.Todos = new TodosCollection();
    this.processLocalStorage();
    this.Navigation = new NavigationView();
    this.Content = new ContentView();

    this.bindEvents();
    this.initialRender();
  },
  initialRender: function() {
    window.localStorage.setItem('filterMonth', '');
  },
  bindEvents: function() {
    $('.content').on('click', '.trash-icon', this.processDeleteTodo.bind(this));
    $('.content').on('click', '.buttons input', this.processFormSubmissions.bind(this));
    // $('.content').on('click', '.todo-item-container', this.processToggleState.bind(this));
    $('.content').on('click', '.modal', this.hideModal);
    $('.all-todos-list').on('click', '.todo-month-container', this.renderTodosByMonth.bind(this));
    $('.all-todos-heading').on('click', this.renderAllTodos.bind(this));
    $('.completed-todos-heading').on('click', this.renderAllCompletedTodos.bind(this));
    $('.navigation').on('click', '.all-todos, .completed-todos, .todo-month-container', this.processTodoGroupClick.bind(this));
  },
  cacheTemplates: function() {
    $("script[type='text/x-handlebars']").each(function() {
      var $template = $(this);
      App.templates[$template.attr('id')] = Handlebars.compile($template.html());
    });

    $("script[data-type='partial']").each(function() {
      var $partial = $(this);
      Handlebars.registerPartial($partial.attr('id'), $partial.html());
    });
  },
  createHelpers: function() {
    Handlebars.registerHelper('formatDateMonthYear', function(dateKey) {
      var dateObj = new Date(dateKey + 'T08:00:00');

      if (isNaN(dateObj.getTime())) { return dateKey; }

      var year = String(dateObj.getFullYear()).slice(2, 4);
      var month = dateObj.getMonth() + 1;

      return month + '/' + year;
    });

    Handlebars.registerHelper('todosCompletedByMonth', function(dateKey) {
      return App.TodoMonths.get(dateKey).completed().length;
    });

    Handlebars.registerHelper('selectedGroupAll', function(todoGroup) {
      var filterMonth = window.localStorage.getItem('filterMonth');
      var filterMonthType = window.localStorage.getItem('filterMonthType');
      if (todoGroup.dateKey === filterMonth && filterMonthType === 'all') {
        return true;
      }
      return false;
    });

    Handlebars.registerHelper('selectedGroupCompleted', function(todoGroup) {
      var filterMonth = window.localStorage.getItem('filterMonth');
      var filterMonthType = window.localStorage.getItem('filterMonthType');
      if (todoGroup.dateKey === filterMonth && filterMonthType === 'completed') {
        return true;
      }
      return false;
    });
  },
  formatInputs: function(formData) {
    var data = formData.reduce(function(acc, input) {
      acc[input.name] = input.value;
      return acc;
    }, {});

    if ((data.year && data.month && data.day)) {
      data.dueDate = data.year + '-' + data.month + '-' + data.day;
    } else {
      data.dueDate = 'No Due Date';
    }

    return data;
  },
  getSelectedMonth: function(e) {
    var dateKey = $(e.currentTarget).data('date-key');
    return this.TodoMonths.get(dateKey);
  },
  getTodoId: function(e, selector) {
    return $(e.currentTarget).closest(selector).data('todo-id');
  },
  hideModal: function(e) {
    if (e) { e.preventDefault(); }

    $('.modal').addClass('hide');
    $('.modal-content').addClass('hide');
  },
  processFormSubmissions: function(e) {
    e.preventDefault();
    var $form = $(e.currentTarget).closest('form');
    var id = $form.data('todo-id');
    var buttonType = $(e.currentTarget).attr('class');

    if (buttonType === 'mark-complete' && !id) {
      alert("Create a todo before marking complete");
      return;
    }

    var todoInfo = this.formatInputs(($form).serializeArray());

    if (buttonType === 'create-todo') {
      this.processTodoInfo(id, todoInfo, false);
    }
    else if (buttonType === 'mark-complete') {
      todoInfo.completed = true;
      this.processTodoInfo(id, todoInfo, true);
    }
  },
  processDeleteTodo: function(e) {
    e.preventDefault();
    var id = this.getTodoId(e, 'tr');
    var filterMonth = window.localStorage.getItem('filterMonth');
    this.Todos.remove(id);
    // this.Todos.get(id).TodoMonth.Todos.remove(id);
    // If we need to trigger the TodoMonth.Todos collection action
    // when the todo item is removed
    $(e.currentTarget).closest('tr').remove();

    var todosGroup = filterMonth ? this.TodoMonths.get(filterMonth) : this.Todos;
    var headingText = todosGroup ? todosGroup.models.length : '0';

    this.saveToLocalStore();

    this.updateMainTodosCount(headingText);
    this.updateNavAllTodosCount(this.Todos.models.length);
    this.updateNavCompletedTodosCount(this.Todos.completed().length);
  },
  processLocalStorage: function() {
    this.Todos.loadList();
  },
  processTodoInfo: function(id, todoInfo, markComplete) {
    id ? this.Todos.get(id).set(todoInfo) : this.Todos.add(todoInfo);

    var filterMonth = window.localStorage.getItem('filterMonth');

    this.saveToLocalStore();
    this.hideModal();

    this.updateMainTodosHeading('All todos');

    if (!markComplete) { this.styleActiveGroup('.all-todos'); }
  },
  styleActiveGroup: function(element) {
    $('.todo-month-container, .all-todos, .completed-todos').removeClass('active-todo-group');
    $(element).addClass('active-todo-group');
  },
  renderAllTodos: function(e) {
    e.preventDefault();
    window.localStorage.setItem('filterMonth', '');

    this.updateMainTodosHeading('All todos');
    this.updateMainTodosCount(Todos.getTodos().length)
  },
  renderAllCompletedTodos: function(e) {
    e.preventDefault();
    window.localStorage.setItem('filterMonth', '');
    window.localStorage.setItem('filterMonthType', 'completed');

    this.updateMainTodosHeading('Completed');
    this.updateMainTodosCount(this.Todos.completed().length);
  },
  renderCompletedTodosByMonth: function(e) {
    e.preventDefault();

    var selectedMonth = this.getSelectedMonth(e);
    window.localStorage.setItem('filterMonthType', 'completed');
    window.localStorage.setItem('filterMonth', selectedMonth.dateKey);

    this.updateMainTodosHeading(selectedMonth.getDateKey());
    this.updateMainTodosCount(selectedMonth.completed().length);
  },
  renderTodosByMonth: function(e) {
    e.preventDefault();

    var selectedMonth = this.getSelectedMonth(e);
    window.localStorage.setItem('filterMonthType', 'all');
    window.localStorage.setItem('filterMonth', selectedMonth.dateKey);

    this.renderMainTodos(selectedMonth);
    this.updateMainTodosHeading(selectedMonth.getDateKey());
    this.updateMainTodosCount(selectedMonth.getTodos().length);
  },
  saveToLocalStore: function() {
    this.Todos.saveToLocalStore();
    this.TodoMonths.saveToLocalStore();
  },
  templates: {},
  processTodoGroupClick: function(e) {
    e.preventDefault();
    this.styleActiveGroup(e.currentTarget);
  },
  updateMainTodosHeading: function(headingText) {
    $('.tasks h1').text(headingText);
  },
  updateMainTodosCount: function(todosCount) {
    $('.tasks .todos-count').text(todosCount);
  },
  updateNavAllTodosCount: function(todosCount) {
    $('.all-todos .todos-count').text(todosCount);
  },
  updateNavCompletedTodosCount: function(todosCount) {
    $('.completed-todos .completed-todos-count').text(todosCount);
  },
  updatePageContents: function(todosGroup) {
    this.renderMainTodos(todosGroup);
    this.renderNavTodos();

    this.updateMainTodosCount(todosGroup.models.length);
    this.updateNavAllTodosCount(this.Todos.models.length);
    this.updateNavCompletedTodosCount(this.Todos.completed().length);
  }
};

$(function() {
  App.init(); // Could also include this in a script tag at the bottom of the body element
});
