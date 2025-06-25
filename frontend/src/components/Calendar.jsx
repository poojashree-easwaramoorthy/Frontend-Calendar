import React, { useState, useEffect } from 'react';
import './Calendar.css';
import eventsData from "../data/events.json";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60,
    color: '#3a87ad',
    description: ''
  });
  const [events, setEvents] = useState(
    eventsData.map(event => ({
      ...event,
      dateObj: new Date(event.date),
      startTime: new Date(`${event.date}T${event.time}`),
      endTime: new Date(new Date(`${event.date}T${event.time}`).getTime() + event.duration * 60000),
      hasConflict: false
    }))
  );
  const [conflictWarning, setConflictWarning] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect and mark conflicting events
  const detectConflicts = (eventsList) => {
    const eventsWithConflicts = [...eventsList];
    
    const sortedEvents = [...eventsWithConflicts].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedEvents.length; i++) {
      let hasConflict = false;
      for (let j = i + 1; j < sortedEvents.length; j++) {
        if (sortedEvents[i].endTime <= sortedEvents[j].startTime) break;
        hasConflict = true;
        sortedEvents[j].hasConflict = true;
      }
      
      const eventIndex = eventsWithConflicts.findIndex(e => e.id === sortedEvents[i].id);
      if (eventIndex !== -1) {
        eventsWithConflicts[eventIndex].hasConflict = hasConflict || sortedEvents[i].hasConflict;
      }
    }
    
    return eventsWithConflicts;
  };

  useEffect(() => {
    setEvents(detectConflicts(events));
  }, [events.length]);

  const checkForConflicts = (proposedEvent) => {
    if (!proposedEvent.date || !proposedEvent.time || !proposedEvent.duration) return [];
    
    const proposedStart = new Date(`${proposedEvent.date}T${proposedEvent.time}`);
    const proposedEnd = new Date(proposedStart.getTime() + proposedEvent.duration * 60000);
    
    const sameDayEvents = events.filter(event => 
      isSameDay(event.dateObj, new Date(proposedEvent.date))
    );
    
    return sameDayEvents.filter(event => {
      return (
        (proposedStart >= event.startTime && proposedStart < event.endTime) ||
        (proposedEnd > event.startTime && proposedEnd <= event.endTime) ||
        (proposedStart <= event.startTime && proposedEnd >= event.endTime)
      );
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentDate(newDate);
  };

  const navigateYear = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarDate(new Date(today));
  };

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  const isSameWeek = (date1, date2) => {
    const first = new Date(date1);
    const second = new Date(date2);
    first.setHours(0, 0, 0, 0);
    second.setHours(0, 0, 0, 0);
    const diff = (first.getTime() - second.getTime()) / (1000 * 60 * 60 * 24);
    return Math.abs(diff) <= 6 && first.getDay() <= second.getDay();
  };

  const getEventsForDay = (date) => {
    return events.filter(event => isSameDay(event.dateObj, date));
  };

  const getEventsForWeek = (date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return events.filter(event => 
      event.dateObj >= weekStart && event.dateObj <= weekEnd
    );
  };

  const renderMiniCalendar = () => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    
    const navigateMiniMonth = (direction) => {
      const newDate = new Date(miniCalendarDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      setMiniCalendarDate(newDate);
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="mini-calendar-day other-month">
          {prevMonthDays - i}
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(
        <div 
          key={`current-${day}`} 
          className={`mini-calendar-day ${isToday(date) ? 'today' : ''}`}
          onClick={() => {
            setCurrentDate(date);
            setView('day');
            if (isMobile) setSidebarOpen(false);
          }}
        >
          {day}
        </div>
      );
    }

    const daysToAdd = 42 - days.length;
    for (let day = 1; day <= daysToAdd; day++) {
      days.push(
        <div key={`next-${day}`} className="mini-calendar-day other-month">
          {day}
        </div>
      );
    }

    return (
      <div className="mini-calendar">
        <div className="mini-calendar-header">
          <button 
            className="mini-nav-button"
            onClick={() => navigateMiniMonth('prev')}
          >
            &lt;
          </button>
          <span>
            {miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            className="mini-nav-button"
            onClick={() => navigateMiniMonth('next')}
          >
            &gt;
          </button>
        </div>
        <div className="mini-calendar-days-header">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="mini-calendar-day-header">{day}</div>
          ))}
        </div>
        <div className="mini-calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  const renderEventsList = () => {
    const upcomingEvents = [...events]
      .filter(event => event.dateObj >= new Date())
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 5);

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    return (
      <div className="events-list-sidebar">
        <h3 className="events-list-header">Upcoming Events</h3>
        <div className="events-list">
          {upcomingEvents.map(event => (
            <div 
              key={event.id} 
              className={`event-item ${event.hasConflict ? 'conflict-event' : ''}`}
              style={{ borderLeft: `3px solid ${event.color}` }}
            >
              <div className="event-time">{event.time}</div>
              <div className="event-details">
                <div className="event-title">{event.title}</div>
                <div className="event-date">{formatDate(event.dateObj)}</div>
                {event.hasConflict && (
                  <div className="conflict-warning">Time conflict!</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    return (
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>Calendar</h3>
          <button 
            className="sidebar-toggle-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '×' : '☰'}
          </button>
        </div>
        <div className="view-options">
          <button 
            className={view === 'schedule' ? 'active' : ''} 
            onClick={() => {
              setView('schedule');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            Schedule
          </button>
          <button 
            className={view === 'day' ? 'active' : ''} 
            onClick={() => {
              setView('day');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            Day
          </button>
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => {
              setView('week');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            Week
          </button>
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => {
              setView('month');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            Month
          </button>
          <button 
            className={view === 'year' ? 'active' : ''} 
            onClick={() => {
              setView('year');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            Year
          </button>
        </div>
        <button 
          onClick={() => {
            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setNewEvent({
              ...newEvent,
              date: formattedDate
            });
            setShowEventModal(true);
            if (isMobile) setSidebarOpen(false);
          }} 
          className="sidebar-new-event-button"
        >
          + Create
        </button>
        {renderMiniCalendar()}
        {renderEventsList()}
      </div>
    );
  };

  const renderHeader = () => {
    let headerText = '';
    let navFunction = navigateMonth;

    switch(view) {
      case 'day':
        headerText = currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        navFunction = navigateDay;
        break;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        headerText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        navFunction = navigateWeek;
        break;
      case 'year':
        headerText = currentDate.getFullYear().toString();
        navFunction = navigateYear;
        break;
      case 'schedule':
        headerText = 'All Events';
        break;
      default:
        headerText = currentDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        navFunction = navigateMonth;
    }

    return (
      <div className="calendar-header">
        <button 
          className="sidebar-toggle-button mobile-only"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <button onClick={navigateToToday} className="today-button">Today</button>
        {view !== 'schedule' && (
          <div className="navigation">
            <button onClick={() => navFunction('prev')} className="nav-button">&lt;</button>
            <h2>{headerText}</h2>
            <button onClick={() => navFunction('next')} className="nav-button">&gt;</button>
          </div>
        )}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = [];
    const dayEvents = getEventsForDay(currentDate);
    
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour}:00`;
      const hourEvents = dayEvents.filter(event => {
        const eventHour = new Date(`${event.date}T${event.time}`).getHours();
        return eventHour === hour;
      });
      
      hours.push(
        <div key={hour} className="hour-row">
          <div className="hour-label">{timeString}</div>
          <div className="hour-events">
            {hourEvents.map(event => (
              <div 
                key={event.id} 
                className={`day-event ${event.hasConflict ? 'conflict-event' : ''}`}
                style={{ backgroundColor: event.color }}
              >
                <div className="event-time">{event.time}</div>
                <div className="event-title">{event.title}</div>
                {event.hasConflict && (
                  <div className="conflict-indicator">⚠️</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="day-view">
        <div className="day-header">
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
        <div className="hour-grid">
          {hours}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    const weekEvents = getEventsForWeek(currentDate);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayEvents = weekEvents.filter(event => isSameDay(event.dateObj, day));
      
      weekDays.push(
        <div key={i} className={`week-day ${isToday(day) ? 'today' : ''}`}>
          <div className="week-day-header">
            <div className="week-day-name">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="week-day-number">
              {day.getDate()}
            </div>
          </div>
          <div className="week-day-events">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`week-event ${event.hasConflict ? 'conflict-event' : ''}`}
                style={{ backgroundColor: event.color }}
              >
                <div className="event-time">{event.time}</div>
                <div className="event-title">{event.title}</div>
                {event.hasConflict && (
                  <div className="conflict-indicator">⚠️</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="week-view">
        <div className="week-header">
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
          {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
        <div className="week-grid">
          {weekDays}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // Previous month days
    const daysFromPrevMonth = firstDayOfMonth;
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < daysFromPrevMonth; i++) {
      days.push(
        <div key={`prev-${i}`} className="calendar-day empty">
          <div className="day-number">{prevMonthDays - daysFromPrevMonth + i + 1}</div>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDay(date);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday(date) ? 'today' : ''}`}
          onClick={() => {
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            setSelectedDate(date);
            setNewEvent({
              ...newEvent,
              date: formattedDate
            });
            setShowEventModal(true);
          }}
        >
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map(event => (
              <div 
                key={event.id} 
                className={`event ${event.hasConflict ? 'conflict-event' : ''}`}
                style={{ backgroundColor: event.color }}
              >
                <div className="event-time">{event.time}</div>
                <div className="event-title">{event.title}</div>
                {event.hasConflict && (
                  <div className="conflict-indicator">⚠️</div>
                )}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="more-events">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    // Next month days (to fill the grid)
    const totalCells = 42; // 6 weeks * 7 days
    const daysFromNextMonth = totalCells - days.length;
    for (let day = 1; day <= daysFromNextMonth; day++) {
      days.push(
        <div key={`next-${day}`} className="calendar-day empty">
          <div className="day-number">{day}</div>
        </div>
      );
    }

    return (
      <div className="month-view">
        <div className="days-of-week">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        <div className="month-grid">
          {days}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Previous month days
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(<div key={`prev-${i}`} className="year-calendar-day empty"></div>);
      }
      
      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push(
          <div 
            key={day} 
            className={`year-calendar-day ${isToday(date) ? 'today' : ''}`}
            onClick={() => {
              setCurrentDate(date);
              setView('month');
            }}
          >
            {day}
          </div>
        );
      }
      
      // Next month days (to fill the grid)
      const totalCells = 42; // 6 weeks * 7 days
      const daysFromNextMonth = totalCells - days.length;
      for (let day = 1; day <= daysFromNextMonth; day++) {
        days.push(<div key={`next-${day}`} className="year-calendar-day empty"></div>);
      }
      
      months.push(
        <div key={month} className="year-month">
          <h3>{new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' })}</h3>
          <div className="year-days-header">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="year-day-header">{day}</div>
            ))}
          </div>
          <div className="year-month-grid">
            {days}
          </div>
        </div>
      );
    }
    
    return (
      <div className="year-view">
        <h2 className="year-header">{year}</h2>
        <div className="year-grid">
          {months}
        </div>
      </div>
    );
  };

  const renderScheduleView = () => {
    const allEvents = [...events].sort((a, b) => a.dateObj - b.dateObj);

    const eventsByMonth = allEvents.reduce((acc, event) => {
      const monthYear = event.dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(event);
      return acc;
    }, {});

    return (
      <div className="schedule-view">
        <div className="schedule-header">
          <h2>All Events</h2>
          <button onClick={navigateToToday} className="today-button">Today</button>
        </div>
        
        {Object.entries(eventsByMonth).map(([monthYear, monthEvents]) => (
          <div key={monthYear} className="month-section">
            <h3 className="month-header">{monthYear}</h3>
            
            {monthEvents.map(event => (
              <div 
                key={event.id} 
                className={`schedule-event ${event.hasConflict ? 'conflict-event' : ''} ${
                  event.dateObj < new Date() ? 'past-event' : ''
                }`}
                style={{ borderLeft: `3px solid ${event.color}` }}
              >
                <div className="event-date">
                  {event.dateObj.toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    weekday: 'short' 
                  })}
                </div>
                <div className="event-details">
                  <div className="event-time">{event.time}</div>
                  <div className="event-title">{event.title}</div>
                  {event.description && (
                    <div className="event-description">{event.description}</div>
                  )}
                </div>
                {event.hasConflict && (
                  <div className="conflict-indicator">⚠️ Conflict</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderEventModal = () => {
    if (!showEventModal) return null;

    const handleTimeChange = (e) => {
      const time = e.target.value;
      setNewEvent({...newEvent, time});
      
      if (newEvent.date && time && newEvent.duration) {
        const conflicts = checkForConflicts({...newEvent, time});
        if (conflicts.length > 0) {
          const conflictTimes = conflicts.map(c => c.time).join(', ');
          setConflictWarning(`Warning: Conflicts with events at ${conflictTimes}`);
        } else {
          setConflictWarning('');
        }
      }
    };

    const handleDateChange = (e) => {
      const date = e.target.value;
      setNewEvent({...newEvent, date});
      
      if (date && newEvent.time && newEvent.duration) {
        const conflicts = checkForConflicts({...newEvent, date});
        if (conflicts.length > 0) {
          const conflictTimes = conflicts.map(c => c.time).join(', ');
          setConflictWarning(`Warning: Conflicts with events at ${conflictTimes}`);
        } else {
          setConflictWarning('');
        }
      }
    };

    const handleDurationChange = (e) => {
      const duration = e.target.value;
      setNewEvent({...newEvent, duration});
      
      if (newEvent.date && newEvent.time && duration) {
        const conflicts = checkForConflicts({...newEvent, duration});
        if (conflicts.length > 0) {
          const conflictTimes = conflicts.map(c => c.time).join(', ');
          setConflictWarning(`Warning: Conflicts with events at ${conflictTimes}`);
        } else {
          setConflictWarning('');
        }
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const conflicts = checkForConflicts(newEvent);
      if (conflicts.length > 0 && !window.confirm('This event conflicts with existing events. Are you sure you want to save it?')) {
        return;
      }
      
      const event = {
        id: Date.now(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        duration: parseInt(newEvent.duration),
        color: newEvent.color,
        description: newEvent.description
      };
      
      const updatedEvents = [...events, {
        ...event,
        dateObj: new Date(event.date),
        startTime: new Date(`${event.date}T${event.time}`),
        endTime: new Date(new Date(`${event.date}T${event.time}`).getTime() + event.duration * 60000),
        hasConflict: conflicts.length > 0
      }];
      
      setEvents(updatedEvents);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        duration: 60,
        color: '#3a87ad',
        description: ''
      });
      setConflictWarning('');
      setShowEventModal(false);
    };

    return (
      <div className="modal-overlay">
        <div className="event-modal">
          <div className="modal-header">
            <h3>Add New Event</h3>
            <button onClick={() => {
              setShowEventModal(false);
              setConflictWarning('');
            }} className="close-button">
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                value={newEvent.date}
                onChange={handleDateChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input 
                type="time" 
                value={newEvent.time}
                onChange={handleTimeChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input 
                type="number" 
                value={newEvent.duration}
                onChange={handleDurationChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input 
                type="color" 
                value={newEvent.color}
                onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>
            {conflictWarning && (
              <div className="conflict-warning-message">
                {conflictWarning}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => {
                setShowEventModal(false);
                setConflictWarning('');
              }}>
                Cancel
              </button>
              <button type="submit">Save Event</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch(view) {
      case 'day': return renderDayView();
      case 'week': return renderWeekView();
      case 'month': return renderMonthView();
      case 'year': return renderYearView();
      case 'schedule': return renderScheduleView();
      default: return renderMonthView();
    }
  };

  return (
    <div className="calendar-app">
      {renderSidebar()}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader()}
        {renderCurrentView()}
      </div>
      {renderEventModal()}
    </div>
  );
};

export default Calendar;