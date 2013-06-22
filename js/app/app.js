$(function () {
    
    collections = {};
    
    var UserModel = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage("KauzoUser"),
        defaults: {
            total: 10,
            cash: 10,
            name: 'Иван Иванов',
            img: 'img/profile.jpg'
        }
    });
    
    var user = new UserModel({id:0});
    user.fetch();
    user.save();
    
    var CauseModel = Backbone.Model.extend();   
    var CausesCollection = Backbone.Collection.extend({
        model: CauseModel,
        url: 'data/causes.json'
    });
    
    var Transaction = Backbone.Model.extend();
    var TransactionsCollection = Backbone.Collection.extend({
        model: Transaction,
        localStorage: new Backbone.LocalStorage("KauzoTransactions")
    });
    
    var VoteModel = Backbone.Model.extend();
    var VotesCollection = Backbone.Collection.extend({
        model: VoteModel,
        localStorage: new Backbone.LocalStorage("KauzoVotes")
    });
    
    var causes  = new CausesCollection();
    transactions  = new TransactionsCollection();
    votes  = new VotesCollection();
    
    
    
    //VIEWS (CONTROLLERS)
    
    var AppView = Backbone.View.extend({
        
        el: '#appRoot',
        
        events: {
            'click #generateTranasction button': 'generateTransaction'
        },
        
        initialize: function () {
            
            
        },
        
        render: function () {
            
        },
        
        generateTransaction: function () {
            
            var self = this,
                el = self.$el.find('input[type=text]'),
                amount = Number(el.val()),
                stars = Math.floor(amount/5) + 1,
                total = user.get('total')+stars,
                cash = user.get('cash')+stars;
            console.log(amount)
            if( isNaN(amount) || amount == 0)
                return alert('Моля, въвеждайте само числа!');
            
            el.val('');
            user.set({
                total: total,
                cash: cash
            });
            user.save();
            
            transactions.create({
                date: new Date(),
                amount: 'BGN'+amount,
                stars: stars
            });
            
        }
        
    });
    
    var CausesView = Backbone.View.extend({
        
        el: '#causesView',
        
        template: _.template($('#causes-template').html()),
        
        modalTemplate: _.template($('#causes-modal-template').html()),
        
        events: {
            'click button.vote': 'onButtonClick',
            'click button.voted': 'onVoteButtonClick'
        },
        
        initialize: function () {
            var self = this;
            tpl = self.template;
            self.collection.fetch();
            self.listenTo(self.collection, 'all', this.render);
        },
        
        render: function () {
            var self = this;
            var $el = self.$el.find('div.carousel-inner');
            
            $el.html(
                self.template({
                    causes: self.collection.toJSON()
                })
            );
            
            return self;
        },
        
        onButtonClick: function(el) {
            var self = this,
                causeId = Number($(el.target).attr('cause-id')),
                model = self.collection.get(causeId),
                modal = $('#causeModal');
            
            if (user.get('cash') <= 0)
                return;
            
            self.voted = model;
            self.value = Math.floor(user.get('cash')/2);
            
            modal.children('div.modal-body').html(
                self.modalTemplate({
                    name: self.collection.get(causeId).get('name'),
                    max: user.get('cash'),
                    value: self.value
                })
            );
            
            $('.slider').slider().on('slide', function(ev) {
                self.value = ev.value;
            });
            
            modal.modal();
        },
        
        onVoteButtonClick: function () {
            
            var self = this,
                modal = $('#causeModal');
            
            if(self.value<=0)
                return;
            
            modal.modal('hide');
            
            var cash = user.get('cash');
            cash -= self.value;
            user.set('cash', cash);
            user.save();
            
            votes.create({
               name: self.voted.get('name'),
               causeId: self.voted.get('id'),
               date: new Date(),
               amount: self.value
            });
            
        }
        
    });
    
    var ProfileView = Backbone.View.extend({
        
        el: '#profileView',
        
        personalTemplate: _.template( $('#personal-template').html() ),
        votesTemplate: _.template( $('#votes-template').html() ),
        transactionsTemplate: _.template( $('#transactions-template').html() ),
        cardsTemplate: '',
        
        events: {
            
        },
        
        initialize: function () {
            
            var self = this;
            
            self.listenTo(votes, 'add', self.renderVotes );
            self.listenTo(transactions, 'add', self.renderTransactions );
            self.listenTo(user, 'change', self.renderPresonal );
            
            votes.fetch();
            transactions.fetch();
        },
        
        render: function () {
            
            this.renderPresonal();
            
        },
        
        renderVotes: function () {
            var self = this;
            
            var col = votes.sortBy(function(m) {
                var date = new Date(m.get('date'));
                return -date.getTime();
            });
            
            var html = self.votesTemplate({votes:col});
            
            self.$el.find('#votes').html(html)
        },
        
        renderTransactions: function () {
            var self = this;
            
            var col = transactions.sortBy(function(m) {
                var date = new Date(m.get('date'));
                return -date.getTime();
            });
            
            var html = self.transactionsTemplate({transactions: col});
            self.$el.find('#transactions').html(html);
            
        },
        
        renderPresonal: function () {
            
            var self = this,
                html = self.personalTemplate(user.toJSON());
            
            self.$el.find('#personal').html(html);            
        }
        
    });
    
    var appView = new AppView ();
    var profileView = new ProfileView({model: user, collection: votes});
    causesView = new CausesView({collection: causes});
    
    appView.render();
    profileView.render();
    causesView.render();
    
    $('.slider').slider();
});